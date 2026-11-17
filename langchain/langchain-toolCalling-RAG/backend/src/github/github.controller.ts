import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { GithubService } from './github.service';
import { ParseCodeDto } from './dto/parse-code.dto';

@Controller(['api/github', 'github'])
export class GithubController {
  private readonly logger = new Logger(GithubController.name);

  constructor(private readonly githubService: GithubService) {}

  /**
   * Step 1: Redirects user to GitHub OAuth authorization screen
   */
  @Get(['auth', 'login'])
  authorize(@Query('state') state: string, @Res() res: Response) {
    const { url } = this.githubService.getAuthUrl(state);
    return res.redirect(url);
  }

  /**
   * Step 2: GitHub redirects back with ?code=...
   * Exchanges code for token, saves account to MongoDB, and redirects back to frontend
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';

    if (error) {
      this.logger.warn(
        `GitHub OAuth authorization rejected by user: ${error} - ${errorDescription}`,
      );
      return res.redirect(
        `${frontendUrl}?github=error&message=${encodeURIComponent(
          errorDescription || error,
        )}`,
      );
    }

    if (!code) {
      throw new BadRequestException(
        'Authorization code was not provided by GitHub',
      );
    }

    try {
      const account = await this.githubService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}?github=connected&user=${encodeURIComponent(
          account.username,
        )}`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      this.logger.error(`GitHub OAuth Callback processing failed: ${message}`);
      return res.redirect(
        `${frontendUrl}?github=error&message=${encodeURIComponent(message)}`,
      );
    }
  }

  /**
   * Status endpoint: check if GitHub account is currently connected
   */
  @Get('status')
  async getStatus() {
    return this.githubService.getStatus();
  }

  /**
   * Disconnect endpoint: removes stored GitHub OAuth credentials
   */
  @Post('disconnect')
  async disconnect() {
    return this.githubService.disconnect();
  }

  /**
   * Repositories endpoint: fetch authenticated user's repositories
   * GET /api/github/repos or /api/github/repositories
   */
  @Get(['repos', 'repositories'])
  async getRepos(
    @Query('visibility') visibility?: 'all' | 'public' | 'private',
    @Query('per_page') perPage?: string,
    @Query('sort') sort?: 'created' | 'updated' | 'pushed' | 'full_name',
  ) {
    return this.githubService.getUserRepositories({
      visibility,
      per_page: perPage ? Number(perPage) : 30,
      sort,
    });
  }

  /**
   * Repository Tree endpoint: fetch repository tree structure
   * GET /api/github/tree
   */
  @Get('tree')
  async getTree(
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('branch') branch?: string,
    @Query('recursive') recursive?: string,
  ) {
    if (!owner || !repo) {
      throw new BadRequestException('Query parameters "owner" and "repo" are required');
    }
    return this.githubService.getRepositoryTree({
      owner,
      repo,
      branch: branch || 'main',
      recursive:
        recursive === undefined ? true : recursive !== 'false' && recursive !== '0',
    });
  }

  /**
   * Repository Content endpoint: fetch file content or directory listing
   * GET /api/github/content
   */
  @Get('content')
  async getContent(
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('path') path?: string,
    @Query('branch') branch?: string,
  ) {
    if (!owner || !repo) {
      throw new BadRequestException('Query parameters "owner" and "repo" are required');
    }
    return this.githubService.getRepositoryFileOrFolder({
      owner,
      repo,
      path: path || '',
      branch,
    });
  }

  /**
   * Code Parsing endpoint using Tree-sitter
   * POST /api/github/parse
   */
  @Post(['parse', 'parse-code'])
  async parseCode(@Body() dto: ParseCodeDto) {
    return this.githubService.parseCode(dto);
  }
}
