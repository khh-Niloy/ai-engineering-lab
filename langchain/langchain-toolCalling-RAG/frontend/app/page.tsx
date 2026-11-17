'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import { DocumentItem, QAItem } from '../lib/types';
import {
  fetchDocuments,
  uploadDocument,
  searchDocument,
  fetchQnas,
} from '../lib/api';
import { QuestionHistory } from '../components/QuestionHistory';
import { ChatSection } from '../components/ChatSection';
import { DocumentSidebar } from '../components/DocumentSidebar';
import {
  FileText,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const emptySubscribe = () => () => {};

export default function Home() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<QAItem[]>([]);
  const [selectedQAId, setSelectedQAId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState<boolean>(true);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [mobileTab, setMobileTab] = useState<'history' | 'chat' | 'docs'>(
    'chat',
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  // Purge any leftover localStorage data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    }
  }, []);

  // Load Documents from Backend
  const loadDocuments = useCallback(
    async (quiet = false) => {
      if (!quiet) setIsRefreshing(true);
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocumentId((prev) => {
            if (prev && docs.some((d) => d._id === prev)) return prev;
            return docs[0]._id;
          });
        }
      } catch (err: unknown) {
        console.error('Failed to load documents:', err);
        if (!quiet) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Cannot connect to backend server on port 5000';
          showToast(msg, 'error');
        }
      } finally {
        if (!quiet) setIsRefreshing(false);
      }
    },
    [showToast],
  );

  // Load Q&A History from Backend Database (model: qna)
  const loadQnaHistory = useCallback(async () => {
    try {
      const qnas = await fetchQnas();
      setHistory(qnas);
    } catch (err: unknown) {
      console.error('Failed to load Q&A history from DB:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    Promise.all([fetchDocuments(), fetchQnas()])
      .then(([docs, qnas]) => {
        if (active) {
          setDocuments(docs);
          setHistory(qnas);
          if (docs.length > 0) {
            setSelectedDocumentId((prev) => prev ?? docs[0]._id);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Initial load failed:', err);
        }
      })
      .finally(() => {
        if (active) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Auto-poll if any document is currently pending or processing
  const hasProcessingDocs = useMemo(() => {
    return documents.some(
      (d) => d.status === 'pending' || d.status === 'processing',
    );
  }, [documents]);

  useEffect(() => {
    if (!hasProcessingDocs) return;

    const interval = setInterval(() => {
      loadDocuments(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [hasProcessingDocs, loadDocuments]);

  // Handle Upload
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await uploadDocument(file);
      showToast(
        `Uploaded "${file.name}" successfully! Queued for vector embedding.`,
        'success',
      );
      // Reload documents and auto-select uploaded doc
      await loadDocuments(true);
      const newDocId = res.document?._id || res.document?.id;
      if (newDocId) {
        setSelectedDocumentId(newDocId);
      }
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Ask Question
  const handleAskQuestion = async (question: string) => {
    if (!selectedDocumentId) {
      showToast('Please select a document first', 'error');
      return;
    }

    setIsLoadingQA(true);
    try {
      const response = await searchDocument(question, selectedDocumentId);

      const savedQA: QAItem = response.qna || {
        id: `qa-${Date.now()}`,
        documentId: selectedDocumentId,
        documentName:
          documents.find((d) => d._id === selectedDocumentId)?.filename ||
          'Document',
        question: response.res.query || question,
        answer: response.res.answer,
        insufficientContext: response.res.insufficientContext,
        rawChunks: response.rawChunks,
        timings: response.timings,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => [
        savedQA,
        ...prev.filter(
          (item) => (item._id || item.id) !== (savedQA._id || savedQA.id),
        ),
      ]);
      setSelectedQAId(savedQA._id || savedQA.id || null);
      setIsNewChat(false);
    } catch (err: unknown) {
      console.error('Search failed:', err);
      const msg = err instanceof Error ? err.message : 'Search query failed';
      showToast(msg, 'error');
    } finally {
      setIsLoadingQA(false);
    }
  };

  const handleNewChat = () => {
    setSelectedQAId(null);
    setIsNewChat(true);
    setMobileTab('chat');
  };

  const selectedDocument = useMemo(() => {
    return documents.find((d) => d._id === selectedDocumentId) || null;
  }, [documents, selectedDocumentId]);

  const currentQA = useMemo(() => {
    if (!selectedQAId) return null;
    return history.find((h) => (h._id || h.id) === selectedQAId) || null;
  }, [history, selectedQAId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-[#0d0d0d] font-sans selection:bg-neutral-200 selection:text-black">
      {/* Toast Notification (ChatGPT clean light style) */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 bg-white/95 border-[#e5e7eb] text-[#0d0d0d]">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Top Header Bar (ChatGPT style) */}
      <header className="h-13 border-b border-[#e5e7eb] bg-white flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] shadow-2xs flex items-center justify-center p-1">
            <Image
              src="/logo.png"
              alt="DocHook Logo"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#0d0d0d] tracking-tight">
              DocHook
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4f4f4] border border-[#e5e7eb] text-[#525252] font-semibold">
              RAG
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/75 border border-[#e5e7eb] text-white/90 font-medium">
              version 1.0
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadDocuments();
              loadQnaHistory();
            }}
            disabled={isRefreshing}
            className="p-1.5 text-[#737373] hover:text-[#0d0d0d] hover:bg-[#f4f4f4] rounded-lg border border-[#e5e7eb] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh documents and Q&A"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0d0d0d]' : ''}`}
            />
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-[#e5e7eb] bg-[#f9f9f9] text-xs">
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-[#737373]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span suppressHydrationWarning>
            All Q&A ({mounted && !isInitialLoading ? history.length : '...'})
          </span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-[#737373]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chat View</span>
        </button>
        <button
          onClick={() => setMobileTab('docs')}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'docs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-[#737373]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span suppressHydrationWarning>
            Docs ({mounted && !isInitialLoading ? documents.length : '...'})
          </span>
        </button>
      </div>

      {/* 3-Column Core Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: All Question and Ans (ChatGPT sidebar aesthetic) */}
        <div
          className={`w-72 shrink-0 h-full ${
            mobileTab === 'history' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <QuestionHistory
            history={history}
            selectedQAId={selectedQAId}
            isLoading={isInitialLoading || isRefreshing}
            onSelectQA={(qa) => {
              setSelectedQAId(qa._id || qa.id || null);
              setIsNewChat(false);
              if (qa.documentId) {
                setSelectedDocumentId(qa.documentId);
              }
              setMobileTab('chat');
            }}
          />
        </div>

        {/* Center Column: Chat Section (uploaded doc / ask question / ask another question) */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'chat'
              ? 'flex flex-col'
              : 'hidden md:flex md:flex-col'
          }`}
        >
          <ChatSection
            selectedDocument={selectedDocument}
            history={history}
            currentQA={currentQA}
            isNewChat={isNewChat}
            onAskQuestion={handleAskQuestion}
            onNewQuestion={handleNewChat}
            isLoading={isLoadingQA}
            isInitialLoading={isInitialLoading}
          />
        </div>

        {/* Right Column: Uploaded Docs & File Upload */}
        <div
          className={`w-76 shrink-0 h-full min-w-0 max-w-[19rem] overflow-hidden ${
            mobileTab === 'docs' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <DocumentSidebar
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            isLoading={isInitialLoading || isRefreshing}
            onSelectDocument={(id) => {
              setSelectedDocumentId(id);
              setSelectedQAId(null);
              setIsNewChat(true);
              setMobileTab('chat');
            }}
            onUploadFile={handleUploadFile}
            isUploading={isUploading}
          />
        </div>
      </div>
    </div>
  );
}
