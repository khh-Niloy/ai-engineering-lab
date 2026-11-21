import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { DocumentService } from './document.service';
import { Document } from './schemas/document.schema';
import { DocumentChunk } from './schemas/document-chunk.schema';
import { SupabaseService } from '../supabase/supabase.service';

describe('DocumentService', () => {
  let service: DocumentService;

  const mockDocumentRecord = {
    _id: new Types.ObjectId('507f191e810c19729de860ea'),
    filename: 'sample.txt',
    fileUrl:
      'https://mock.supabase.co/storage/v1/object/public/documents/sample.txt',
    originalText: 'Hello world. This is a test document.',
    status: 'completed',
    totalChunks: 1,
  };

  const mockDocumentModel = {
    create: jest.fn().mockResolvedValue(mockDocumentRecord),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentRecord),
    }),
  };

  const mockDocumentChunkModel = {
    create: jest.fn(),
    insertMany: jest.fn().mockResolvedValue([]),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockSupabaseService = {
    uploadFile: jest.fn().mockResolvedValue({
      fileUrl:
        'https://mock.supabase.co/storage/v1/object/public/documents/sample.txt',
      path: 'sample.txt',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getModelToken(Document.name),
          useValue: mockDocumentModel,
        },
        {
          provide: getModelToken(DocumentChunk.name),
          useValue: mockDocumentChunkModel,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChunks', () => {
    it('should split LangChain documents into chunks using RecursiveCharacterTextSplitter', async () => {
      const docs = [
        new LangchainDocument({
          pageContent: 'Sentence one. Sentence two. Sentence three.',
          metadata: { source: 'sample.txt' },
        }),
      ];

      const chunks = await service.createChunks(docs, 20, 5);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].pageContent).toBeDefined();
    });
  });

  describe('handleUpload', () => {
    it('should upload to Supabase, chunk, generate embeddings with LangChain, and save to DB with metadata', async () => {
      const mockFile = {
        originalname: 'sample.txt',
        mimetype: 'text/plain',
        size: 38,
        buffer: Buffer.from('Hello world. This is a test document.'),
      } as Express.Multer.File;

      const mockVector = [0.1, 0.2, 0.3];
      const embeddingsSpy = jest
        .spyOn(service, 'generateEmbeddings')
        .mockResolvedValue([mockVector]);

      const result = await service.handleUpload(mockFile);

      expect(mockSupabaseService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(embeddingsSpy).toHaveBeenCalled();
      expect(mockDocumentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'sample.txt',
          fileUrl:
            'https://mock.supabase.co/storage/v1/object/public/documents/sample.txt',
          status: 'completed',
        }),
      );
      expect(mockDocumentChunkModel.insertMany).toHaveBeenCalled();

      const insertManyCalls = mockDocumentChunkModel.insertMany.mock
        .calls as Array<[Array<Record<string, unknown>>]>;
      const insertedChunks = insertManyCalls[0][0];

      expect(insertedChunks[0].documentId).toEqual(mockDocumentRecord._id);
      expect(insertedChunks[0].embedding).toEqual(mockVector);

      const metadata = insertedChunks[0].metadata as Record<string, unknown>;
      expect(metadata.fileName).toBe('sample.txt');
      expect(metadata.fileType).toBe('txt');
      expect(metadata.chunkIndex).toBe(0);
      expect(metadata.pageNumber).toBe(1);

      expect(result.stats.totalChunks).toBeGreaterThan(0);
      expect(result.stats.embeddingDimension).toBe(3);
    });
  });
});
