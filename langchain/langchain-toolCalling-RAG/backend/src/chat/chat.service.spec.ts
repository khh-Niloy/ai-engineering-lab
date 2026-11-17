import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { Qna } from './schemas/qna.schema';
import { Document } from '../document/schemas/document.schema';
import { DocumentChunk } from '../document/schemas/document-chunk.schema';
import { DocumentService } from '../document/document.service';

describe('ChatService', () => {
  let service: ChatService;

  const mockDocumentId = new Types.ObjectId('507f191e810c19729de860ea');
  const mockDocumentRecord = {
    _id: mockDocumentId,
    filename: 'test.pdf',
    fileUrl: 'https://mock.supabase.co/test.pdf',
    totalChunks: 1,
  };

  const mockChunkRecord = {
    _id: new Types.ObjectId('507f191e810c19729de860eb'),
    documentId: mockDocumentId,
    text: 'LangChain provides tools and chains for LLM development.',
    embedding: [0.1, 0.2, 0.3],
    metadata: { fileName: 'test.pdf', pageNumber: 1, chunkIndex: 0 },
  };

  const mockQnaRecord = {
    _id: new Types.ObjectId('507f191e810c19729de860ec'),
    documentId: mockDocumentId.toString(),
    documentName: 'test.pdf',
    question: 'What does LangChain provide?',
    answer: 'LangChain provides tools and chains for LLM development.',
    insufficientContext: false,
    rawChunks: [mockChunkRecord],
    timings: { totalSeconds: 0.5 },
  };

  const mockDocumentModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocumentRecord),
      }),
    }),
  };

  const mockDocumentChunkModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockChunkRecord]),
      }),
    }),
  };

  const mockQnaModel = {
    create: jest.fn().mockResolvedValue(mockQnaRecord),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockQnaRecord]),
        }),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQnaRecord),
      }),
    }),
  };

  const mockDocumentService = {
    generateQueryEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Document.name),
          useValue: mockDocumentModel,
        },
        {
          provide: getModelToken(DocumentChunk.name),
          useValue: mockDocumentChunkModel,
        },
        {
          provide: getModelToken(Qna.name),
          useValue: mockQnaModel,
        },
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('retrieveChunks', () => {
    it('should embed query and retrieve relevant chunks with cosine similarity', async () => {
      const result = await service.retrieveChunks(
        'What does LangChain provide?',
        mockDocumentId.toString(),
      );

      expect(mockDocumentService.generateQueryEmbedding).toHaveBeenCalledWith(
        'What does LangChain provide?',
      );
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.chunks[0].text).toContain('LangChain');
      expect(result.chunks[0].score).toBeGreaterThan(0.9);
    });
  });

  describe('handleQuery', () => {
    it('should execute full retrieval, answer generation, and QnA storage', async () => {
      const result = await service.handleQuery({
        query: 'What does LangChain provide?',
        documentId: mockDocumentId.toString(),
      });

      expect(result.res.query).toBe('What does LangChain provide?');
      expect(result.rawChunks.length).toBeGreaterThan(0);
      expect(mockQnaModel.create).toHaveBeenCalled();
      expect(result.qna).toBeDefined();
    });
  });
});
