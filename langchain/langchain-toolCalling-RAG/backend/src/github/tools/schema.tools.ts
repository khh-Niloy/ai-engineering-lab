import { z } from 'zod';

export const fetchUserRepositoriesSchema = z.object({
  visibility: z
    .enum(['all', 'public', 'private'])
    .optional()
    .default('all')
    .describe('Filter repositories by visibility: "all", "public", or "private". Defaults to "all".'),
  per_page: z
    .number()
    .optional()
    .default(30)
    .describe('The number of repositories to return (max 100). Defaults to 30.'),
  sort: z
    .enum(['created', 'updated', 'pushed', 'full_name'])
    .optional()
    .default('updated')
    .describe('Field to sort repositories by. Defaults to "updated".'),
});

export type FetchUserRepositoriesInput = z.infer<typeof fetchUserRepositoriesSchema>;

export const fetchRepositoryTreeSchema = z.object({
  owner: z
    .string()
    .describe('The GitHub account username or organization name that owns the repository.'),
  repo: z
    .string()
    .describe('The name of the GitHub repository.'),
  branch: z
    .string()
    .optional()
    .default('main')
    .describe('The branch name or commit SHA to get the tree for (e.g., "main", "master"). Defaults to "main".'),
  recursive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to fetch the entire directory tree recursively. Defaults to true.'),
});

export type FetchRepositoryTreeInput = z.infer<typeof fetchRepositoryTreeSchema>;

export const fetchRepositoryFileSchema = z.object({
  owner: z
    .string()
    .describe('The GitHub account username or organization name that owns the repository.'),
  repo: z
    .string()
    .describe('The name of the GitHub repository.'),
  path: z
    .string()
    .describe('The path to the file or folder within the repository (e.g., "src/index.ts", "package.json", or "src/components").'),
  branch: z
    .string()
    .optional()
    .describe('The branch or commit reference (e.g., "main", "dev"). Defaults to repository default branch if omitted.'),
});

export type FetchRepositoryFileInput = z.infer<typeof fetchRepositoryFileSchema>;
