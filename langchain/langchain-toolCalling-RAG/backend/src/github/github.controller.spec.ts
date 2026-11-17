import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import type { Response } from 'express';

describe('GithubController', () => {
  let controller: GithubController;

  const mockGithubService = {
    getAuthUrl: jest.fn().mockReturnValue({
      url: 'https://github.com/login/oauth/authorize?client_id=123',
      state: 'random_state',
    }),
    handleCallback: jest.fn().mockResolvedValue({
      username: 'octocat',
      githubId: '12345',
    }),
    getStatus: jest.fn().mockResolvedValue({
      connected: true,
      user: { username: 'octocat' },
    }),
    disconnect: jest.fn().mockResolvedValue({
      message: 'GitHub account disconnected successfully',
    }),
    getUserRepositories: jest.fn().mockResolvedValue([
      { name: 'repo-1', full_name: 'octocat/repo-1' },
    ]),
    getRepositoryTree: jest.fn().mockResolvedValue({
      owner: 'octocat',
      repo: 'repo-1',
      tree: [{ path: 'src/index.ts', type: 'file' }],
    }),
    getRepositoryFileOrFolder: jest.fn().mockResolvedValue({
      type: 'file',
      name: 'README.md',
      content: '# Hello',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        {
          provide: GithubService,
          useValue: mockGithubService,
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('authorize', () => {
    it('should redirect user to GitHub auth URL', () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      controller.authorize('test_state', mockRes);
      expect(mockGithubService.getAuthUrl).toHaveBeenCalledWith('test_state');
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://github.com/login/oauth/authorize?client_id=123',
      );
    });
  });

  describe('callback', () => {
    it('should exchange code and redirect to frontend with success', async () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.callback('valid_code', 'state', '', '', mockRes);
      expect(mockGithubService.handleCallback).toHaveBeenCalledWith(
        'valid_code',
        'state',
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('github=connected&user=octocat'),
      );
    });

    it('should redirect with error when GitHub passes error parameter', async () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.callback('', '', 'access_denied', 'The user has denied your request', mockRes);
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('github=error'),
      );
    });
  });

  describe('getStatus', () => {
    it('should return status from GithubService', async () => {
      const result = await controller.getStatus();
      expect(result).toEqual({
        connected: true,
        user: { username: 'octocat' },
      });
    });
  });

  describe('disconnect', () => {
    it('should call disconnect on GithubService', async () => {
      const result = await controller.disconnect();
      expect(mockGithubService.disconnect).toHaveBeenCalled();
      expect(result.message).toContain('disconnected');
    });
  });

  describe('tool testing endpoints', () => {
    it('should call getUserRepositories with query parameters', async () => {
      const result = await controller.getRepos('public', '10', 'updated');
      expect(mockGithubService.getUserRepositories).toHaveBeenCalledWith({
        visibility: 'public',
        per_page: 10,
        sort: 'updated',
      });
      expect(result).toHaveLength(1);
    });

    it('should call getRepositoryTree with owner and repo', async () => {
      const result = await controller.getTree('octocat', 'repo-1', 'main', 'true');
      expect(mockGithubService.getRepositoryTree).toHaveBeenCalledWith({
        owner: 'octocat',
        repo: 'repo-1',
        branch: 'main',
        recursive: true,
      });
      expect(result.owner).toBe('octocat');
    });

    it('should throw BadRequestException if owner or repo is missing in getTree', async () => {
      await expect(controller.getTree('', 'repo-1')).rejects.toThrow();
    });

    it('should call getRepositoryFileOrFolder with path', async () => {
      const result = await controller.getContent('octocat', 'repo-1', 'README.md', 'main');
      expect(mockGithubService.getRepositoryFileOrFolder).toHaveBeenCalledWith({
        owner: 'octocat',
        repo: 'repo-1',
        path: 'README.md',
        branch: 'main',
      });
      expect(result.type).toBe('file');
    });

    it('should throw BadRequestException if owner or repo is missing in getContent', async () => {
      await expect(controller.getContent('octocat', '')).rejects.toThrow();
    });
  });
});
