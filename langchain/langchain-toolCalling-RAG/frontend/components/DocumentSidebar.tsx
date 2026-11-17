'use client';

import React, { useRef, useState } from 'react';
import { DocumentItem, UploadResponse } from '../lib/types';
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
} from 'lucide-react';

interface DocumentSidebarProps {
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (docId: string) => void;
  onUploadFile: (file: File) => Promise<UploadResponse | void>;
  isUploading: boolean;
  isLoading?: boolean;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  isUploading,
  isLoading = false,
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-tight text-[#0d0d0d]">
            Uploaded doc
          </h2>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white border border-[#e5e7eb] text-[#525252] shadow-2xs">
            {documents.length}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.csv,.md,.json"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Upload Dropzone */}
      <div className="p-3">
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
        <div className="pt-2 pb-0.5">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8e8e8e] px-1">
            Documents (Click to chat)
          </p>
        </div>

        {isLoading ? (
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
  );
};
