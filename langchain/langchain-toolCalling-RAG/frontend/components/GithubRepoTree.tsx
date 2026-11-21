'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TreeItem, RepositoryFileContent } from '../lib/types';
import { fetchRepositoryTree, fetchRepositoryContent } from '../lib/api';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  GitBranch,
} from 'lucide-react';

interface GithubRepoTreeProps {
  owner: string;
  repo: string;
  branch: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children: TreeNode[];
}

const buildTree = (items: TreeItem[]): TreeNode[] => {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Ensure items are sorted so folders come first, then files alphabetically
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const prevPath = currentPath;
      currentPath = prevPath ? `${prevPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!map.has(currentPath)) {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          type: isLast && item.type === 'file' ? 'file' : 'directory',
          size: isLast ? item.size : undefined,
          children: [],
        };

        map.set(currentPath, node);

        if (i === 0) {
          root.push(node);
        } else {
          const parent = map.get(prevPath);
          if (parent) {
            parent.children.push(node);
          }
        }
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    }
  };

  sortNodes(root);
  return root;
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-500 shrink-0" />;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'json':
      return <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'md':
      return <FileText className="w-4 h-4 text-purple-500 shrink-0" />;
    case 'css':
    case 'scss':
    case 'html':
      return <FileCode className="w-4 h-4 text-pink-500 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
      return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'csv':
    case 'xlsx':
      return <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  }
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const GithubRepoTree: React.FC<GithubRepoTreeProps> = ({
  owner,
  repo,
  branch,
}) => {
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // File Preview modal/drawer state
  const [activeFile, setActiveFile] = useState<RepositoryFileContent | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRepositoryTree(owner, repo, branch);
      setTreeItems(data.tree || []);

      // Auto-expand top level directories
      const initialExpanded = new Set<string>();
      for (const item of data.tree || []) {
        const parts = item.path.split('/');
        if (parts.length > 1) {
          initialExpanded.add(parts[0]);
        }
      }
      setExpandedPaths(initialExpanded);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch repository tree',
      );
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, branch]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const item of treeItems) {
      const parts = item.path.split('/');
      let curr = '';
      for (let i = 0; i < parts.length - 1; i++) {
        curr = curr ? `${curr}/${parts[i]}` : parts[i];
        all.add(curr);
      }
    }
    setExpandedPaths(all);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const handleCopy = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleOpenFile = async (path: string) => {
    setIsLoadingFile(true);
    setFileError(null);
    try {
      const fileData = await fetchRepositoryContent(owner, repo, path, branch);
      setActiveFile(fileData);
    } catch (err: unknown) {
      setFileError(
        err instanceof Error ? err.message : 'Failed to load file contents',
      );
    } finally {
      setIsLoadingFile(false);
    }
  };

  const treeData = useMemo(() => buildTree(treeItems), [treeItems]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    const q = searchQuery.toLowerCase();

    const filterNode = (node: TreeNode): TreeNode | null => {
      if (node.type === 'file') {
        return node.name.toLowerCase().includes(q) ||
          node.path.toLowerCase().includes(q)
          ? node
          : null;
      }

      const filteredChildren = node.children
        .map(filterNode)
        .filter((child): child is TreeNode => child !== null);

      if (
        filteredChildren.length > 0 ||
        node.name.toLowerCase().includes(q) ||
        node.path.toLowerCase().includes(q)
      ) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return treeData
      .map(filterNode)
      .filter((n): n is TreeNode => n !== null);
  }, [treeData, searchQuery]);

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = expandedPaths.has(node.path);
      const isFile = !isDir;

      return (
        <div key={node.path} className="text-xs font-mono">
          <div
            onClick={() => {
              if (isDir) {
                toggleFolder(node.path);
              } else {
                handleOpenFile(node.path);
              }
            }}
            style={{ paddingLeft: `${depth * 18 + 12}px` }}
            className={`flex items-center justify-between py-1.5 pr-3 hover:bg-neutral-100 rounded-lg group transition-colors cursor-pointer select-none ${
              activeFile?.path === node.path ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isDir ? (
                <span className="text-neutral-400 group-hover:text-neutral-700">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )}
                </span>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}

              {isDir ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                )
              ) : (
                getFileIcon(node.name)
              )}

              <span className={`truncate text-xs ${isDir ? 'font-semibold text-neutral-800' : 'text-neutral-700'}`}>
                {node.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isFile && node.size !== undefined && (
                <span className="text-[10px] text-neutral-400">
                  {formatSize(node.size)}
                </span>
              )}

              {/* Copy path button */}
              <button
                type="button"
                onClick={(e) => handleCopy(node.path, e)}
                title="Copy relative path"
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200 text-neutral-500 transition-opacity"
              >
                {copiedPath === node.path ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {isDir && isExpanded && node.children.length > 0 && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="px-5 py-3 border-b border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files in tree..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
            <span>{branch || 'main'}</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-neutral-300" />

          <span className="text-[11px] text-neutral-500 font-mono">
            {treeItems.length} items
          </span>

          <button
            type="button"
            onClick={loadTree}
            disabled={isLoading}
            title="Reload tree"
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tree Canvas or State Display */}
      <div className="flex-1 overflow-y-auto p-4 font-mono">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600 mb-2" />
            <p className="text-xs font-sans text-neutral-600">
              Loading repository tree structure...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-rose-600">
            <AlertCircle className="w-7 h-7 mb-2 stroke-1" />
            <p className="text-xs font-medium font-sans">{error}</p>
            <button
              type="button"
              onClick={loadTree}
              className="mt-3 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-sans"
            >
              Try Again
            </button>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 font-sans">
            <p className="text-xs">
              {searchQuery ? 'No files match your search' : 'Empty repository tree'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">{renderTree(filteredTree)}</div>
        )}
      </div>

      {/* File Content Preview Modal/Drawer */}
      {activeFile && (
        <div className="absolute inset-0 z-30 bg-black/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-neutral-200 flex flex-col font-sans">
            {/* Modal Header */}
            <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(activeFile.name)}
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-neutral-900 truncate font-mono">
                    {activeFile.path}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {formatSize(activeFile.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeFile.content);
                    setCopiedPath('file-content');
                    setTimeout(() => setCopiedPath(null), 2000);
                  }}
                  className="px-2.5 py-1 text-xs border border-neutral-200 rounded-lg hover:bg-white text-neutral-700 flex items-center gap-1 font-sans"
                >
                  {copiedPath === 'file-content' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                {activeFile.download_url && (
                  <a
                    href={activeFile.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
                    title="Open Raw File"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveFile(null)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal File Code Body */}
            <div className="flex-1 overflow-auto p-4 bg-[#fbfbfb] font-mono text-xs text-neutral-800 whitespace-pre leading-relaxed selection:bg-neutral-200">
              <code>{activeFile.content || '(Empty file or binary content)'}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
