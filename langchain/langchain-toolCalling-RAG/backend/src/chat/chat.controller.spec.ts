import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;

  const mockChatService = {
    handleQuery: jest.fn().mockResolvedValue({
      res: {
        query: 'test query',
        answer: 'test answer',
        insufficientContext: false,
      },
      rawChunks: [],
      timings: { totalSeconds: 0.1 },
    }),
    getAllQnas: jest.fn().mockResolvedValue([]),
    getQnaById: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should route query to handleQuery', async () => {
    const result = await controller.query({ query: 'hello' });
    expect(mockChatService.handleQuery).toHaveBeenCalledWith({
      query: 'hello',
    });
    expect(result).toBeDefined();
  });
});
