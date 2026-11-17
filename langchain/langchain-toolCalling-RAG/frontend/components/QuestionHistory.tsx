'use client';

import React from 'react';
import Image from 'next/image';
import { QAItem } from '../lib/types';
import { MessageSquare, Clock, ArrowUpRight, Zap } from 'lucide-react';

interface QuestionHistoryProps {
  history: QAItem[];
  selectedQAId: string | null;
  onSelectQA: (qa: QAItem) => void;
  isLoading?: boolean;
}

const formatDateWithTime = (dateInput?: string | number) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })}, ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const QuestionHistory: React.FC<QuestionHistoryProps> = ({
  history,
  selectedQAId,
  onSelectQA,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#f9f9f9] border-r border-[#e5e7eb] font-sans">
      {/* Header with App Logo and Brand Title */}
      <div className="p-3 border-b border-[#e5e7eb] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 relative rounded-lg bg-white shadow-2xs border border-[#e5e7eb] flex items-center justify-center p-1">
            <Image
              src="/logo.png"
              alt="DevMind Logo"
              width={22}
              height={22}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#0d0d0d] tracking-tight">
              All question and ans
            </h2>
            {isLoading ? (
              <div className="h-2.5 w-16 bg-[#e5e7eb] rounded-full animate-pulse mt-1" />
            ) : (
              <p className="text-[10px] text-[#737373]" suppressHydrationWarning>
                {history.length}{' '}
                {history.length === 1 ? 'interaction' : 'interactions'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={`history-skeleton-${idx}`}
                className="w-full p-2.5 rounded-lg border border-[#e5e7eb] bg-white animate-pulse space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3.5 w-20 bg-[#e5e7eb] rounded" />
                  <div className="h-2.5 w-14 bg-[#f0f0f0] rounded" />
                </div>
                <div className="h-3 w-4/5 bg-[#e5e7eb] rounded" />
                <div className="space-y-1 pt-0.5">
                  <div className="h-2.5 w-full bg-[#f5f5f5] rounded" />
                  <div className="h-2.5 w-3/4 bg-[#f5f5f5] rounded" />
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
                  <div className="h-2 w-8 bg-[#f0f0f0] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center p-4 text-[#8e8e8e]">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e5e7eb] flex items-center justify-center mb-2.5 text-[#a3a3a3] shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-[#404040]">
              No questions yet
            </p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-[190px]">
              Click on an uploaded document and ask a question to see history here.
            </p>
          </div>
        ) : (
          history.map((qa, idx) => {
            const itemId = qa._id || qa.id || `qa-${idx}`;
            const isSelected =
              selectedQAId === itemId ||
              selectedQAId === qa._id ||
              selectedQAId === qa.id;
            const dateStr = qa.createdAt || qa.timestamp;

            return (
              <div
                key={itemId}
                onClick={() => onSelectQA(qa)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all duration-150 group relative cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs ring-1 ring-blue-400/30'
                    : 'bg-transparent hover:bg-[#efefef] border-transparent text-[#262626]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border max-w-[130px] truncate shadow-2xs ${
                      isSelected
                        ? 'bg-blue-100/70 border-blue-200 text-blue-800'
                        : 'bg-white border-[#e5e7eb] text-[#525252]'
                    }`}
                  >
                    {qa.documentName || 'Document'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {dateStr && (
                      <span
                        className={`text-[10px] flex items-center gap-1 font-mono ${
                          isSelected ? 'text-blue-700/80' : 'text-[#8e8e8e]'
                        }`}
                        suppressHydrationWarning
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>{formatDateWithTime(dateStr)}</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium text-[#0d0d0d] line-clamp-1 leading-snug">
                  {qa.question}
                </p>

                <p className="text-[11px] text-[#666666] mt-1 line-clamp-2 leading-relaxed">
                  {qa.answer.replace(/<[^>]*>?/gm, ' ')}
                </p>

                {qa.timings && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#737373] font-mono">
                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                    <span>{qa.timings.totalSeconds}s</span>
                  </div>
                )}

                <ArrowUpRight className="w-3 h-3 absolute top-2.5 right-2 text-[#8e8e8e] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
