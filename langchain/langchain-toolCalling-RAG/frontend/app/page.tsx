"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DocumentItem, QAItem, GithubUser, GithubRepo } from "../lib/types";
import {
  fetchDocuments,
  uploadDocument,
  searchDocument,
  fetchQnas,
  fetchGithubStatus,
  disconnectGithub,
  getGithubLoginUrl,
  fetchGithubRepositories,
} from "../lib/api";
import { LeftSidebar, NavItemKey } from "../components/LeftSidebar";
import { RightSidebar, RightSidebarTab } from "../components/RightSidebar";
import { ChatSection } from "../components/ChatSection";
import { GithubWorkspace } from "../components/GithubWorkspace";
import { GithubRepoSidebar } from "../components/GithubRepoSidebar";
import { AlertCircle, CheckCircle, Layers, Menu } from "lucide-react";

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItemKey>("doc-query");
  const [rightTab, setRightTab] = useState<RightSidebarTab>("documents");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<QAItem[]>([]);
  const [selectedQAId, setSelectedQAId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState<boolean>(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [mobileView, setMobileView] = useState<"nav" | "main" | "right">(
    "main",
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const loadGithubRepos = useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await fetchGithubRepositories();
      setGithubRepos(repos);
      if (repos.length > 0) {
        setSelectedRepo((prev) =>
          prev && repos.some((r) => r.name === prev.name) ? prev : repos[0],
        );
      } else {
        setSelectedRepo(null);
      }
    } catch (err) {
      console.error("Failed to load GitHub repositories:", err);
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  const loadGithubStatus = useCallback(async () => {
    try {
      const status = await fetchGithubStatus();
      setGithubUser(status.connected ? status.user : null);
      if (status.connected) {
        loadGithubRepos();
      } else {
        setGithubRepos([]);
        setSelectedRepo(null);
      }
    } catch (err) {
      console.error("Failed to fetch GitHub status:", err);
    }
  }, [loadGithubRepos]);

  // If user switches to github-query and is connected, refresh repos if empty
  useEffect(() => {
    if (activeNav === "github-query" && githubUser && githubRepos.length === 0) {
      loadGithubRepos();
    }
  }, [activeNav, githubUser, githubRepos.length, loadGithubRepos]);

  // Handle GitHub OAuth redirect parameters in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ghStatus = params.get("github");
    if (ghStatus === "connected") {
      const user = params.get("user");
      showToast(
        `GitHub account linked successfully! ${user ? `@${user}` : ""}`,
        "success",
      );
      loadGithubStatus();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (ghStatus === "error") {
      const message = params.get("message") || "GitHub connection failed";
      showToast(message, "error");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showToast, loadGithubStatus]);

  const handleConnectGithub = () => {
    setIsGithubLoading(true);
    window.location.href = getGithubLoginUrl();
  };

  const handleDisconnectGithub = async () => {
    setIsGithubLoading(true);
    try {
      await disconnectGithub();
      setGithubUser(null);
      showToast("GitHub account disconnected", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to disconnect GitHub",
        "error",
      );
    } finally {
      setIsGithubLoading(false);
    }
  };

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
        console.error("Failed to load documents:", err);
        if (!quiet) {
          const msg =
            err instanceof Error
              ? err.message
              : "Cannot connect to backend server on port 5000";
          showToast(msg, "error");
        }
      } finally {
        if (!quiet) setIsRefreshing(false);
      }
    },
    [showToast],
  );

  // Initial load
  useEffect(() => {
    let active = true;
    Promise.all([fetchDocuments(), fetchQnas(), fetchGithubStatus()])
      .then(([docs, qnas, ghStatus]) => {
        if (active) {
          setDocuments(docs);
          setHistory(qnas);
          if (ghStatus?.connected) {
            setGithubUser(ghStatus.user);
          }
          if (docs.length > 0) {
            setSelectedDocumentId((prev) => prev ?? docs[0]._id);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("Initial load failed:", err);
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
      (d) => d.status === "pending" || d.status === "processing",
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
        `Uploaded "${file.name}" successfully! Indexed with vector embeddings.`,
        "success",
      );
      // Reload documents and auto-select uploaded doc
      await loadDocuments(true);
      const newDocId = res.document?._id || res.document?.id;
      if (newDocId) {
        setSelectedDocumentId(newDocId);
      }
      return res;
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Ask Question
  const handleAskQuestion = async (question: string) => {
    if (!selectedDocumentId) {
      showToast("Please select a document first", "error");
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
          "Document",
        question,
        answer: response.res?.answer || "No response generated.",
        insufficientContext: response.res?.insufficientContext || false,
        rawChunks: response.rawChunks || [],
        timings: response.timings,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => [savedQA, ...prev]);
      setSelectedQAId(savedQA._id || savedQA.id || null);
      setIsNewChat(false);
    } catch (err: unknown) {
      console.error("Search failed:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to query document";
      showToast(msg, "error");
    } finally {
      setIsLoadingQA(false);
    }
  };

  const handleNewChat = () => {
    setSelectedQAId(null);
    setIsNewChat(true);
  };

  const selectedDocument = useMemo(() => {
    if (!selectedDocumentId) return documents[0] || null;
    return documents.find((d) => d._id === selectedDocumentId) || null;
  }, [documents, selectedDocumentId]);

  const currentQA = useMemo(() => {
    if (!selectedQAId) return null;
    return history.find((h) => (h._id || h.id) === selectedQAId) || null;
  }, [history, selectedQAId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#0d0d0d] font-sans selection:bg-neutral-200 selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 bg-white/95 border-[#e5e7eb] text-[#0d0d0d]">
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* 1. FIXED LEFT SIDEBAR */}
      <div
        className={`h-full shrink-0 z-30 ${
          mobileView === "nav"
            ? "fixed inset-y-0 left-0 flex shadow-xl"
            : "hidden md:flex"
        }`}
      >
        <LeftSidebar
          activeNav={activeNav}
          onSelectNav={(key) => {
            setActiveNav(key);
            setMobileView("main");
          }}
        />
      </div>

      {/* Mobile Backdrop for Left Sidebar */}
      {mobileView === "nav" && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileView("main")}
        />
      )}

      {/* 2. CENTER MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2.5 border-b border-[#e5e7eb] bg-white">
          <button
            onClick={() => setMobileView("nav")}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <span>
              {activeNav === "doc-query"
                ? "Project Documentation Query"
                : "Github related query (Developers)"}
            </span>
          </div>
          <button
            onClick={() =>
              setMobileView(mobileView === "right" ? "main" : "right")
            }
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs flex items-center gap-1"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Center Page Content */}
        {activeNav === "doc-query" ? (
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
        ) : (
          <GithubWorkspace
            githubUser={githubUser}
            isGithubLoading={isGithubLoading}
            onConnectGithub={handleConnectGithub}
            onDisconnectGithub={handleDisconnectGithub}
            selectedRepo={selectedRepo}
            reposCount={githubRepos.length}
          />
        )}
      </div>

      {/* 3. RIGHT SIDEBAR - CONDITIONAL BASED ON ACTIVE NAV */}
      {/* 3A. For "Project Documentation Query": Documents & Previous Chats */}
      {activeNav === "doc-query" && (
        <div
          className={`w-84 shrink-0 h-full min-w-0 max-w-[21.5rem] overflow-hidden z-20 ${
            mobileView === "right"
              ? "fixed inset-y-0 right-0 flex shadow-xl"
              : "hidden md:flex"
          }`}
        >
          <RightSidebar
            activeTab={rightTab}
            onChangeTab={setRightTab}
            // Documents tab props
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={(id) => {
              setSelectedDocumentId(id);
              setSelectedQAId(null);
              setIsNewChat(true);
              setMobileView("main");
            }}
            onUploadFile={handleUploadFile}
            isUploading={isUploading}
            isLoadingDocs={isInitialLoading || isRefreshing}
            // Previous Chats tab props
            history={history}
            selectedQAId={selectedQAId}
            onSelectQA={(qa) => {
              setSelectedQAId(qa._id || qa.id || null);
              setIsNewChat(false);
              if (qa.documentId) {
                setSelectedDocumentId(qa.documentId);
              }
              setActiveNav("doc-query");
              setMobileView("main");
            }}
            isLoadingHistory={isInitialLoading || isRefreshing}
          />
        </div>
      )}

      {/* 3B. For "Github related query (Developers)": Repositories Sidebar */}
      {activeNav === "github-query" && (
        <div
          className={`w-84 shrink-0 h-full min-w-0 max-w-[21.5rem] overflow-hidden z-20 ${
            mobileView === "right"
              ? "fixed inset-y-0 right-0 flex shadow-xl"
              : "hidden md:flex"
          }`}
        >
          <GithubRepoSidebar
            repos={githubRepos}
            isLoading={isLoadingRepos}
            selectedRepoName={selectedRepo?.name ?? null}
            onSelectRepo={(repo) => {
              setSelectedRepo(repo);
              setMobileView("main");
            }}
            onRefresh={loadGithubRepos}
            isConnected={!!githubUser}
            onConnectGithub={handleConnectGithub}
          />
        </div>
      )}

      {/* Mobile Backdrop for Right Sidebar */}
      {mobileView === "right" && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setMobileView("main")}
        />
      )}
    </div>
  );
}
