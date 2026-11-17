import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';
import { GithubAccount } from './schemas/github-account.schema';

describe('GithubService', () => {
  let service: GithubService;

  const mockGithubAccountModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GITHUB_CLIENT_ID') return 'mock_client_id';
      if (key === 'GITHUB_CLIENT_SECRET') return 'mock_client_secret';
      if (key === 'GITHUB_CALLBACK_URL') return 'http://localhost:5000/api/github/callback';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: getModelToken(GithubAccount.name),
          useValue: mockGithubAccountModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate valid GitHub OAuth authorization URL', () => {
      const { url, state } = service.getAuthUrl('test_state');
      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=mock_client_id');
      expect(url).toContain('state=test_state');
      expect(state).toBe('test_state');
    });
  });

  describe('getStatus', () => {
    it('should return connected false when no account exists', async () => {
      mockGithubAccountModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const status = await service.getStatus();
      expect(status.connected).toBe(false);
      expect(status.user).toBeNull();
    });

    it('should return connected true and user info when account exists', async () => {
      const mockAccount = {
        username: 'octocat',
        displayName: 'The Octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231',
        email: 'octocat@github.com',
        scope: 'read:user repo',
        accessToken: 'gho_secret',
      };

      mockGithubAccountModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockAccount),
          }),
        }),
      });

      const status = await service.getStatus();
      expect(status.connected).toBe(true);
      expect(status.user?.username).toBe('octocat');
    });
  });

  describe('disconnect', () => {
    it('should clear stored GitHub accounts', async () => {
      const result = await service.disconnect();
      expect(mockGithubAccountModel.deleteMany).toHaveBeenCalled();
      expect(result.message).toContain('disconnected');
    });
  });
});
