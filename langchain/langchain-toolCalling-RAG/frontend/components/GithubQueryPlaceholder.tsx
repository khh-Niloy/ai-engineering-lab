'use client';

import React from 'react';
import { GithubUser, GithubRepo } from '../lib/types';
import { Loader2, FolderGit2, GitBranch, ExternalLink, Globe, Lock } from 'lucide-react';

interface GithubQueryPlaceholderProps {
  githubUser?: GithubUser | null;
  isGithubLoading?: boolean;
  onConnectGithub?: () => void;
  onDisconnectGithub?: () => void;
  selectedRepo?: GithubRepo | null;
  reposCount?: number;
}

export const GithubQueryPlaceholder: React.FC<GithubQueryPlaceholderProps> = ({
  githubUser,
  isGithubLoading,
  onConnectGithub,
  onDisconnectGithub,
  selectedRepo,
  reposCount = 0,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-white font-sans p-6 text-center select-none">
      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-800 mb-5 shadow-xs">
          <svg
            className="w-8 h-8 fill-current text-neutral-800"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Github related query (Developers)
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
          Repository indexing, commits, pull request discussions, code context querying, and developer insights.
        </p>

        {/* Status / Connect Button */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {githubUser ? (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl shadow-2xs">
              {githubUser.avatarUrl && (
                <img
                  src={githubUser.avatarUrl}
                  alt={githubUser.username}
                  className="w-7 h-7 rounded-full border border-neutral-200"
                />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-neutral-900">
                  @{githubUser.username}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GitHub Account Connected
                </p>
              </div>
              <button
                type="button"
                onClick={onDisconnectGithub}
                disabled={isGithubLoading}
                className="ml-2 text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectGithub}
              disabled={isGithubLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer"
            >
              {isGithubLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 fill-current text-white"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              )}
              <span>Connect GitHub</span>
            </button>
          )}

          {/* Active Repository Card if selected */}
          {githubUser && selectedRepo && (
            <div className="w-full mt-2 p-3 bg-white border border-[#e5e7eb] rounded-xl shadow-2xs text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {selectedRepo.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono border ${
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
                  <a
                    href={selectedRepo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-neutral-400 hover:text-neutral-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              {selectedRepo.description && (
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                  {selectedRepo.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-500 font-mono">
                {selectedRepo.language && <span>{selectedRepo.language}</span>}
                <span className="flex items-center gap-0.5">
                  <GitBranch className="w-2.5 h-2.5" />
                  <span>{selectedRepo.default_branch}</span>
                </span>
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Under Development</span>
          </div>
        </div>
      </div>
    </div>
  );
};
