'use client';

import React, { useRef, useState } from 'react';
import { DocumentItem, QAItem, UploadResponse } from '../lib/types';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileCode,
  FileSpreadsheet,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Folder,
} from 'lucide-react';

export type RightSidebarTab = 'documents' | 'chats';

interface RightSidebarProps {
  activeTab: RightSidebarTab;
  onChangeTab: (tab: RightSidebarTab) => void;
  // Documents tab props
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (docId: string) => void;
  onUploadFile: (file: File) => Promise<UploadResponse | void>;
  isUploading: boolean;
  isLoadingDocs?: boolean;
  // Previous Chats tab props
  history: QAItem[];
  selectedQAId: string | null;
  onSelectQA: (qa: QAItem) => void;
  isLoadingHistory?: boolean;
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

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activeTab,
  onChangeTab,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  isUploading,
  isLoadingDocs = false,
  history,
  selectedQAId,
  onSelectQA,
  isLoadingHistory = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (ext === 'docx') return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
    return <FileCode className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-full bg-[#f9f9f9] border-l border-[#e5e7eb] font-sans overflow-hidden">
      {/* Tab Switcher Header */}
      <div className="p-2.5 border-b border-[#e5e7eb] bg-white shrink-0">
        <div className="grid grid-cols-2 p-1 bg-[#f0f0f0] rounded-xl text-xs font-medium gap-1">
          {/* Documents Tab Button */}
          <button
            onClick={() => onChangeTab('documents')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-[#0d0d0d] font-semibold shadow-2xs'
                : 'text-[#666] hover:text-[#0d0d0d]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Documents</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 ${
                activeTab === 'documents'
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-700'
                  : 'bg-white/70 border-neutral-200/60 text-neutral-500'
              }`}
            >
              {documents.length}
            </span>
          </button>

          {/* Previous Chats Tab Button */}
          <button
            onClick={() => onChangeTab('chats')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-white text-[#0d0d0d] font-semibold shadow-2xs'
                : 'text-[#666] hover:text-[#0d0d0d]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Previous Chats</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 ${
                activeTab === 'chats'
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-700'
                  : 'bg-white/70 border-neutral-200/60 text-neutral-500'
              }`}
            >
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.csv,.md,.json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {/* Upload Dropzone */}
          <div className="p-3 shrink-0">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all duration-150 ${
                dragActive
                  ? 'border-[#0d0d0d] bg-neutral-100 ring-2 ring-black/5'
                  : 'border-[#d4d4d4] hover:border-[#a3a3a3] bg-white hover:bg-[#fbfbfb] shadow-2xs'
              } ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 mx-auto text-blue-600 animate-spin mb-1" />
              ) : (
                <UploadCloud className="w-5 h-5 mx-auto text-[#737373] mb-1" />
              )}
              <p className="text-xs font-medium text-[#171717]">
                {isUploading ? 'Uploading & Queuing...' : 'Drop PDF, DOCX or TXT here'}
              </p>
              <p className="text-[10px] text-[#737373] mt-0.5">
                Auto-indexed via Supabase & LangChain
              </p>
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 space-y-2 min-w-0 w-full">
            <div className="pt-1 pb-0.5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8e8e8e] px-1">
                Documents (Click to chat)
              </p>
            </div>

            {isLoadingDocs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={`doc-skeleton-${idx}`}
                    className="p-3 rounded-xl border border-[#e5e7eb] bg-white animate-pulse shadow-2xs space-y-2 w-full min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 w-full">
                      <div className="w-7 h-7 rounded-lg bg-[#e5e7eb] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3.5 bg-[#e5e7eb] rounded w-3/4" />
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-[#f0f0f0] rounded w-16" />
                          <div className="h-3.5 bg-[#f0f0f0] rounded w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-[#8e8e8e] text-xs">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDocumentId === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => onSelectDocument(doc._id)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer group relative w-full min-w-0 overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-2xs ring-1 ring-blue-400/40'
                        : 'bg-white border-[#e5e7eb] hover:border-[#d4d4d4] hover:bg-[#fbfbfb] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-blue-100/70 border-blue-200'
                              : 'bg-neutral-100 border-neutral-200'
                          }`}
                        >
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className={`text-xs font-medium leading-snug break-all [word-break:break-word] [overflow-wrap:anywhere] ${
                              isSelected
                                ? 'text-blue-950 font-semibold'
                                : 'text-[#0d0d0d] group-hover:text-black'
                            }`}
                            title={doc.filename}
                          >
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Status Badge */}
                            {doc.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{doc.totalChunks || 0} chunks</span>
                              </span>
                            )}
                            {doc.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                <span>Embedding...</span>
                              </span>
                            )}
                            {doc.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded font-medium">
                                <Clock className="w-3 h-3" />
                                <span>Queued</span>
                              </span>
                            )}
                            {doc.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                                <AlertCircle className="w-3 h-3" />
                                <span>Failed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Supabase Link */}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open file in Supabase Storage"
                          className="p-1 text-[#8e8e8e] hover:text-[#0d0d0d] hover:bg-neutral-100 rounded transition-colors shrink-0 cursor-pointer ml-1 mt-0.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PREVIOUS CHATS */}
      {activeTab === 'chats' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header indicator */}
          <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between shrink-0 bg-white/60">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-[#0d0d0d]">
                All question and ans
              </span>
            </div>
            <span className="text-[10px] text-[#737373]">
              {history.length} {history.length === 1 ? 'interaction' : 'interactions'}
            </span>
          </div>

          {/* List of Previous Chats */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-w-0">
            {isLoadingHistory ? (
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
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center p-4 text-[#8e8e8e]">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#e5e7eb] flex items-center justify-center mb-2.5 text-[#a3a3a3] shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-[#404040]">
                  No previous chats yet
                </p>
                <p className="text-[11px] text-[#737373] mt-1 max-w-[190px]">
                  Ask questions about any uploaded document to see interaction history here.
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
                        : 'bg-white hover:bg-[#f3f4f6] border-[#e5e7eb] text-[#262626] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border max-w-[130px] truncate shadow-2xs ${
                          isSelected
                            ? 'bg-blue-100/70 border-blue-200 text-blue-800'
                            : 'bg-neutral-50 border-[#e5e7eb] text-[#525252]'
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
      )}
    </div>
  );
};
