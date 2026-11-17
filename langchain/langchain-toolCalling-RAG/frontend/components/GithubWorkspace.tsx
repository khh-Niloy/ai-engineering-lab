'use client';

import React, { useState } from 'react';
import { GithubRepo, GithubUser } from '../lib/types';
import { GithubRepoTree } from './GithubRepoTree';
import { GithubQueryPlaceholder } from './GithubQueryPlaceholder';
import {
  FolderGit2,
  FolderTree,
  MessageSquare,
  GitBranch,
  ExternalLink,
  Lock,
  Globe,
  Star,
} from 'lucide-react';

export type GithubWorkspaceTab = 'query' | 'tree';

interface GithubWorkspaceProps {
  githubUser: GithubUser | null;
  isGithubLoading: boolean;
  onConnectGithub: () => void;
  onDisconnectGithub: () => void;
  selectedRepo: GithubRepo | null;
  reposCount: number;
}

export const GithubWorkspace: React.FC<GithubWorkspaceProps> = ({
  githubUser,
  isGithubLoading,
  onConnectGithub,
  onDisconnectGithub,
  selectedRepo,
  reposCount,
}) => {
  const [activeTab, setActiveTab] = useState<GithubWorkspaceTab>('query');

  if (!githubUser || !selectedRepo) {
    return (
      <GithubQueryPlaceholder
        githubUser={githubUser}
        isGithubLoading={isGithubLoading}
        onConnectGithub={onConnectGithub}
        onDisconnectGithub={onDisconnectGithub}
        selectedRepo={selectedRepo}
        reposCount={reposCount}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden font-sans">
      {/* Top Header Bar for Selected Repository & Tabs */}
      <div className="h-14 px-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
        {/* Left: Selected Repo Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[#0d0d0d] tracking-tight truncate">
              {selectedRepo.full_name}
            </span>

            {/* Privacy Badge */}
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono border shrink-0 ${
                selectedRepo.private
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              {selectedRepo.private ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Globe className="w-2.5 h-2.5" />
              )}
              <span>{selectedRepo.private ? 'Private' : 'Public'}</span>
            </span>

            {/* Branch Badge */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-100 border border-neutral-200 text-neutral-600 shrink-0">
              <GitBranch className="w-2.5 h-2.5" />
              <span>{selectedRepo.default_branch || 'main'}</span>
            </span>

            {/* External link */}
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on GitHub"
              className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right: Tabs (Query vs Tree) */}
        <div className="flex items-center gap-1 bg-[#f3f4f6] p-1 rounded-xl border border-[#e5e7eb] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('query')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'query'
                ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Query</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>Tree</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'tree' ? (
          <GithubRepoTree
            owner={selectedRepo.owner}
            repo={selectedRepo.name}
            branch={selectedRepo.default_branch || 'main'}
          />
        ) : (
          <GithubQueryPlaceholder
            githubUser={githubUser}
            isGithubLoading={isGithubLoading}
            onConnectGithub={onConnectGithub}
            onDisconnectGithub={onDisconnectGithub}
            selectedRepo={selectedRepo}
            reposCount={reposCount}
          />
        )}
      </div>
    </div>
  );
};
