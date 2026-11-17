'use client';

import React, { useState, useRef } from 'react';
import { DocumentItem, UploadResponse } from '../lib/types';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Layers,
  Database,
  Cpu,
  Search,
  RefreshCw,
  FileCheck,
  HardDrive,
} from 'lucide-react';

interface DocumentIngestionViewProps {
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onUploadFile: (file: File) => Promise<UploadResponse | void>;
  isUploading: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUploadStats: UploadResponse | null;
}

export const DocumentIngestionView: React.FC<DocumentIngestionViewProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  isUploading,
  isLoading,
  onRefresh,
  isRefreshing,
  lastUploadStats,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'json':
      case 'md':
        return <FileCode className="w-5 h-5 text-violet-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const totalChunks = documents.reduce(
    (acc, doc) => acc + (doc.totalChunks || 0),
    0,
  );
  const completedDocs = documents.filter((d) => d.status === 'completed').length;
  const processingDocs = documents.filter(
    (d) => d.status === 'processing' || d.status === 'pending',
  ).length;

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selectedDocument =
    documents.find((d) => d._id === selectedDocumentId) ||
    (documents.length > 0 ? documents[0] : null);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-neutral-50/50">
      {/* Top Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                Document Ingestion & Vector Pipeline
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Upload, parse, chunk, and embed documents into MongoDB vector store via LangChain and Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors"
              title="Refresh documents list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-neutral-500 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Documents</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {documents.length}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {completedDocs} indexed successfully
            </p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Chunks</span>
              <Layers className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{totalChunks}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Stored with embeddings
            </p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Pipeline Status</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold text-neutral-900">
                {processingDocs > 0 ? `${processingDocs} Processing` : 'Ready'}
              </p>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              LangChain + Gemini / OpenAI
            </p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Storage Engine</span>
              <HardDrive className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-900">Supabase & Mongo</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Object store + Vector DB
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.csv,.txt,.md,.json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50'
            } ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 shadow-xs">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 text-neutral-500" />
              )}
            </div>

            <h3 className="text-sm font-semibold text-neutral-800">
              {isUploading
                ? 'Ingesting document into vector store...'
                : 'Click to select or drag and drop your document'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Supported formats: <span className="font-medium text-neutral-700">PDF, DOCX, CSV, TXT, MD, JSON</span> (Up to 25 MB).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                1. Supabase Upload
              </span>
              <span className="text-neutral-400">→</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                2. LangChain Parse & Chunk
              </span>
              <span className="text-neutral-400">→</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                3. Vector Embedding
              </span>
              <span className="text-neutral-400">→</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                4. MongoDB Storage
              </span>
            </div>
          </div>

          {/* Last Upload Result Banner */}
          {lastUploadStats && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-950">
                    {lastUploadStats.message || 'File ingested successfully!'}
                  </p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    File: <span className="font-mono">{lastUploadStats.document?.filename}</span> • Chunks:{' '}
                    <span className="font-bold">{lastUploadStats.stats?.totalChunks ?? lastUploadStats.document?.totalChunks ?? 0}</span> •
                    Characters: {lastUploadStats.stats?.totalCharacters ?? 'N/A'} • Embedding Dim:{' '}
                    {lastUploadStats.stats?.embeddingDimension ?? 'N/A'}
                  </p>
                </div>
              </div>
              {lastUploadStats.document?.fileUrl && (
                <a
                  href={lastUploadStats.document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Storage</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Ingested Documents List and Inspector Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Table / List */}
          <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Ingested Knowledge Base
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  {filteredDocuments.length}
                </span>
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-40 sm:w-48"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="py-1.5 px-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden text-neutral-700"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Queued</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-neutral-100 mt-2 max-h-[460px] overflow-y-auto">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <p className="text-xs">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="py-14 text-center text-neutral-400">
                  <FileCheck className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs font-medium text-neutral-600">
                    No documents found
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {searchQuery
                      ? 'Try adjusting your search criteria.'
                      : 'Upload a file using the dropzone above.'}
                  </p>
                </div>
              ) : (
                filteredDocuments.map((doc) => {
                  const isSelected = selectedDocumentId === doc._id;
                  return (
                    <div
                      key={doc._id}
                      onClick={() => onSelectDocument(doc._id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border border-blue-200 shadow-2xs'
                          : 'hover:bg-neutral-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold text-neutral-900 truncate"
                            title={doc.filename}
                          >
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span>
                              {doc.createdAt
                                ? new Date(doc.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    },
                                  )
                                : 'Recent'}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {doc.totalChunks ?? 0} chunks
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge */}
                        {doc.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Indexed</span>
                          </span>
                        )}
                        {doc.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            <span>Embedding</span>
                          </span>
                        )}
                        {doc.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Queued</span>
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}

                        {/* Supabase Link */}
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-white rounded-md border border-transparent hover:border-neutral-200 transition-colors"
                            title="Open in Supabase Storage"
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

          {/* Selected Document Metadata Inspector */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs flex flex-col">
            <h2 className="text-sm font-semibold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <span>Document Inspector</span>
              {selectedDocument && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedDocument.status}
                </span>
              )}
            </h2>

            {selectedDocument ? (
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Filename
                  </p>
                  <p className="font-semibold text-neutral-900 mt-0.5 break-all">
                    {selectedDocument.filename}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Chunks Created
                    </p>
                    <p className="text-base font-bold text-neutral-900 mt-0.5">
                      {selectedDocument.totalChunks || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Status
                    </p>
                    <p className="text-sm font-semibold capitalize text-neutral-800 mt-0.5">
                      {selectedDocument.status}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Document ID
                  </p>
                  <p className="font-mono text-[11px] text-neutral-600 mt-0.5 break-all bg-neutral-50 p-1.5 rounded border border-neutral-200">
                    {selectedDocument._id}
                  </p>
                </div>

                {selectedDocument.fileUrl && (
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Supabase Storage URL
                    </p>
                    <a
                      href={selectedDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 underline mt-1 text-[11px] break-all"
                    >
                      <span>View file in Supabase</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

                {selectedDocument.createdAt && (
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Ingestion Timestamp
                    </p>
                    <p className="text-neutral-600 mt-0.5">
                      {new Date(selectedDocument.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedDocument.originalText && (
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                      Text Sample (Extracted)
                    </p>
                    <div className="max-h-36 overflow-y-auto p-2 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedDocument.originalText.slice(0, 1000)}
                      {selectedDocument.originalText.length > 1000 && '...'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Select a document to inspect metadata and vector embedding details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
