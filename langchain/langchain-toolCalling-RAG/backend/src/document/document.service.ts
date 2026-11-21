import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document, DocumentRecord } from './schemas/document.schema';
import {
  DocumentChunk,
  DocumentChunkRecord,
} from './schemas/document-chunk.schema';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private embeddingsInstance: Embeddings | null = null;

  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentRecord>,
    @InjectModel(DocumentChunk.name)
    private readonly documentChunkModel: Model<DocumentChunkRecord>,
    private readonly supabaseService: SupabaseService,
  ) {}

  getEmbeddingsInstance(): Embeddings {
    if (this.embeddingsInstance) {
      return this.embeddingsInstance;
    }

    const googleApiKey =
      process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (googleApiKey) {
      const model = process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001';
      this.logger.log(`Initializing GoogleGenerativeAIEmbeddings (${model})...`);
      this.embeddingsInstance = new GoogleGenerativeAIEmbeddings({
        apiKey: googleApiKey,
        model,
      });
      return this.embeddingsInstance;
    }

    if (openaiApiKey) {
      this.logger.log(
        'Initializing OpenAIEmbeddings (text-embedding-3-small)...',
      );
      this.embeddingsInstance = new OpenAIEmbeddings({
        apiKey: openaiApiKey,
        model: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
      });
      return this.embeddingsInstance;
    }

    throw new InternalServerErrorException(
      'Embedding API key is missing. Please set GOOGLE_API_KEY (or GEMINI_API_KEY) or OPENAI_API_KEY in your environment.',
    );
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      const embeddings = this.getEmbeddingsInstance();
      this.logger.log(`Generating embeddings for ${texts.length} chunk(s)...`);

      const vectors = await embeddings.embedDocuments(texts);
      this.logger.log(
        `Successfully generated ${vectors.length} vector embeddings (dimension: ${vectors[0]?.length ?? 0})`,
      );

      return vectors;
    } catch (error) {
      this.logger.error(
        'Failed to generate vector embeddings with LangChain Embeddings:',
        error instanceof Error ? error.stack : error,
      );
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!query || !query.trim()) {
      throw new BadRequestException('Query string is required for embedding');
    }

    const embeddings = this.getEmbeddingsInstance();
    return await embeddings.embedQuery(query);
  }

  async loadDocumentWithLangchain(
    buffer: Buffer,
    originalName: string,
  ): Promise<LangchainDocument[]> {
    const ext = path.extname(originalName).toLowerCase();
    const blob = new Blob([new Uint8Array(buffer)]);

    try {
      switch (ext) {
        case '.pdf': {
          const loader = new PDFLoader(blob, { splitPages: true });
          return await loader.load();
        }
        case '.docx': {
          const loader = new DocxLoader(blob);
          return await loader.load();
        }
        case '.csv': {
          const loader = new CSVLoader(blob);
          return await loader.load();
        }
        case '.txt':
        case '.md':
        case '.json': {
          const textContent = buffer.toString('utf-8');
          return [
            new LangchainDocument({
              pageContent: textContent,
              metadata: {
                source: originalName,
              },
            }),
          ];
        }
        default:
          throw new BadRequestException(
            `Unsupported file format "${ext}". Supported formats: .pdf, .docx, .csv, .txt, .md, .json`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Failed to parse document "${originalName}" with LangChain loader:`,
        error instanceof Error ? error.stack : error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to load and parse document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createChunks(
    docs: LangchainDocument[],
    chunkSize = 1000,
    chunkOverlap = 200,
  ): Promise<LangchainDocument[]> {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const chunks = await textSplitter.splitDocuments(docs);
    this.logger.log(
      `Generated ${chunks.length} chunks from ${docs.length} document section(s) (chunkSize: ${chunkSize}, chunkOverlap: ${chunkOverlap})`,
    );
    return chunks;
  }

  async handleUpload(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File and file buffer are required');
    }

    this.logger.log(
      `Processing uploaded file: ${file.originalname} (${file.size} bytes)`,
    );

    // 1. Upload file buffer to Supabase and get accessible public URL
    const { fileUrl } = await this.supabaseService.uploadFile(file);

    // 2. Load document pages/content with LangChain Document Loaders from buffer
    const loadedDocs = await this.loadDocumentWithLangchain(
      file.buffer,
      file.originalname,
    );

    const originalText = loadedDocs
      .map((doc) => doc.pageContent)
      .join('\n\n')
      .trim();

    // 3. Create chunks using LangChain text splitter
    const chunks = await this.createChunks(loadedDocs);

    // 4. Generate vector embeddings for all chunk texts using LangChain Embeddings
    const chunkTexts = chunks.map((chunk) => chunk.pageContent);
    const embeddings = await this.generateEmbeddings(chunkTexts);

    // 5. Persist parent document record into MongoDB with Supabase fileUrl
    const savedDocument = await this.documentModel.create({
      filename: file.originalname,
      fileUrl,
      originalText,
      status: 'completed',
      totalChunks: chunks.length,
    });

    // 6. Create and persist document chunks with embeddings & structured metadata in MongoDB
    const fileExt = path
      .extname(file.originalname)
      .replace(/^\./, '')
      .toLowerCase();

    const chunkDocs = chunks.map((chunk, index) => {
      // Extract page number if available from LangChain loader metadata (e.g. PDFLoader)
      const rawPageNumber =
        (chunk.metadata?.loc as { pageNumber?: number } | undefined)
          ?.pageNumber ?? (chunk.metadata?.pageNumber as number | undefined);
      const pageNumber =
        typeof rawPageNumber === 'number' && rawPageNumber > 0
          ? rawPageNumber
          : 1;

      return {
        documentId: savedDocument._id,
        text: chunk.pageContent,
        embedding: embeddings[index] ?? [],
        metadata: {
          documentId: savedDocument._id,
          fileName: file.originalname,
          fileType: fileExt,
          fileUrl,
          chunkIndex: index,
          totalChunks: chunks.length,
          pageNumber,
          charCount: chunk.pageContent.length,
        },
      };
    });

    if (chunkDocs.length > 0) {
      await this.documentChunkModel.insertMany(chunkDocs);
    }

    this.logger.log(
      `Document "${savedDocument.filename}" saved with ID: ${savedDocument._id.toString()} | Chunks with metadata & embeddings saved: ${chunkDocs.length}`,
    );

    return {
      message:
        'File uploaded to Supabase, chunked, embedded, and stored successfully with metadata using LangChain',
      document: savedDocument,
      stats: {
        totalCharacters: originalText.length,
        loadedPagesOrSections: loadedDocs.length,
        totalChunks: chunks.length,
        embeddingDimension: embeddings[0]?.length ?? 0,
      },
    };
  }

  async getAllDocuments() {
    return this.documentModel.find().sort({ createdAt: -1 }).exec();
  }

  async getDocumentById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid document ID format: ${id}`);
    }

    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return document;
  }
}
