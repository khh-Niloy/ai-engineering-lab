import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { GithubService } from '../github.service';
import {
  fetchUserRepositoriesSchema,
  FetchUserRepositoriesInput,
  fetchRepositoryTreeSchema,
  FetchRepositoryTreeInput,
  fetchRepositoryFileSchema,
  FetchRepositoryFileInput,
} from './schema.tools';

@Injectable()
export class GithubToolsService {
  constructor(private readonly githubService: GithubService) {}

  getUserRepositoriesTool() {
    return tool(
      async (input: FetchUserRepositoriesInput) => {
        const result = await this.githubService.getUserRepositories(input);
        return JSON.stringify(result);
      },
      {
        name: 'fetch_user_repositories',
        description:
          'Fetches the list of repositories belonging to or accessible by the authenticated user on GitHub. Returns repository names, descriptions, default branches, and URLs.',
        schema: fetchUserRepositoriesSchema,
      },
    );
  }

  getRepositoryTreeTool() {
    return tool(
      async (input: FetchRepositoryTreeInput) => {
        const result = await this.githubService.getRepositoryTree(input);
        return JSON.stringify(result);
      },
      {
        name: 'fetch_repository_tree',
        description:
          'Fetches the complete directory and file tree structure of a GitHub repository. Useful to inspect the project layout, locate source files, and understand codebase architecture.',
        schema: fetchRepositoryTreeSchema,
      },
    );
  }

  getRepositoryFileTool() {
    return tool(
      async (input: FetchRepositoryFileInput) => {
        const result =
          await this.githubService.getRepositoryFileOrFolder(input);
        return JSON.stringify(result);
      },
      {
        name: 'fetch_repository_file',
        description:
          'Fetches the content of a specific file or lists the items in a folder in a GitHub repository given owner, repo name, and file/folder path.',
        schema: fetchRepositoryFileSchema,
      },
    );
  }
}
