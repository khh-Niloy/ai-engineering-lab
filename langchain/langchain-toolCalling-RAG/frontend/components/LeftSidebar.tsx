'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, GitBranch } from 'lucide-react';

export type NavItemKey = 'doc-query' | 'github-query';

interface LeftSidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeNav,
  onSelectNav,
}) => {
  return (
    <aside className="w-64 shrink-0 h-full bg-[#fbfbfb] border-r border-[#e5e7eb] flex flex-col justify-between font-sans select-none">
      {/* Brand Header */}
      <div>
        <div className="h-14 px-4 border-b border-[#e5e7eb] flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] shadow-2xs flex items-center justify-center p-1 shrink-0">
            <Image
              src="/logo.png"
              alt="DevMind Logo"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-[#0d0d0d] tracking-tight">
                DevMind
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold">
                RAG
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 truncate">
              Intelligence Platform
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1.5">
          <div className="px-2 pb-1 pt-1">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8e8e8e]">
              Workspaces
            </p>
          </div>

          {/* 1. Project Documentation Query */}
          <button
            onClick={() => onSelectNav('doc-query')}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
              activeNav === 'doc-query'
                ? 'bg-white border border-[#e5e7eb] text-[#0d0d0d] shadow-2xs ring-1 ring-black/5 font-semibold'
                : 'text-[#525252] hover:bg-[#f3f4f6] hover:text-[#0d0d0d] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeNav === 'doc-query'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Project Documentation Query</span>
            </div>
            {activeNav === 'doc-query' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
            )}
          </button>

          {/* 2. Github related query (Developers) */}
          <button
            onClick={() => onSelectNav('github-query')}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
              activeNav === 'github-query'
                ? 'bg-white border border-[#e5e7eb] text-[#0d0d0d] shadow-2xs ring-1 ring-black/5 font-semibold'
                : 'text-[#525252] hover:bg-[#f3f4f6] hover:text-[#0d0d0d] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeNav === 'github-query'
                    ? 'bg-purple-50 text-purple-600 border border-purple-200'
                    : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Github related query (Developers)</span>
            </div>
            {activeNav === 'github-query' && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Profile / User Info */}
      <div className="p-3 border-t border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#0d0d0d] truncate">
              Developer
            </p>
            <p className="text-[10px] text-neutral-400 truncate">
              DevMind Workspace
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
