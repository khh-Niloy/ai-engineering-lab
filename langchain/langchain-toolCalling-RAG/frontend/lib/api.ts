import {
  DocumentItem,
  UploadResponse,
  SearchResponse,
  QAItem,
  GithubStatusResponse,
  GithubRepo,
  RepositoryTreeResponse,
  RepositoryFileContent,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function extractData<T>(json: unknown): T {
  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    (json as { data: unknown }).data !== undefined
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/document`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let errorMsg = `Failed to load documents (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<DocumentItem[]>(json) ?? [];
}

export async function fetchDocument(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/document/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let errorMsg = `Failed to fetch document (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<DocumentItem>(json);
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/document/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = `Upload failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<UploadResponse>(json);
}

export async function searchDocument(
  query: string,
  documentId?: string,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      documentId: documentId || undefined,
    }),
  });

  if (!res.ok) {
    let errorMsg = `Search failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<SearchResponse>(json);
}

export async function fetchQnas(): Promise<QAItem[]> {
  const res = await fetch(`${API_BASE}/chat/qna`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let errorMsg = `Failed to load Q&A history (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<QAItem[]>(json) ?? [];
}

export async function fetchQna(id: string): Promise<QAItem> {
  const res = await fetch(`${API_BASE}/chat/qna/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Q&A item: ${res.statusText}`);
  }
  const json = await res.json();
  return extractData<QAItem>(json);
}

export async function fetchGithubStatus(): Promise<GithubStatusResponse> {
  const res = await fetch(`${API_BASE}/api/github/status`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return { connected: false, user: null };
  }
  const json = await res.json();
  return extractData<GithubStatusResponse>(json);
}

export async function disconnectGithub(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/github/disconnect`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to disconnect GitHub');
  }
  const json = await res.json();
  return extractData<{ message: string }>(json);
}

export function getGithubLoginUrl(): string {
  return `${API_BASE}/api/github/login`;
}

export async function fetchGithubRepositories(): Promise<GithubRepo[]> {
  const res = await fetch(`${API_BASE}/api/github/repos`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let errorMsg = `Failed to load repositories (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<GithubRepo[]>(json) ?? [];
}

export async function fetchRepositoryTree(
  owner: string,
  repo: string,
  branch?: string,
): Promise<RepositoryTreeResponse> {
  const params = new URLSearchParams({ owner, repo });
  if (branch) params.append('branch', branch);

  const res = await fetch(`${API_BASE}/api/github/tree?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    let errorMsg = `Failed to load repository tree (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<RepositoryTreeResponse>(json);
}

export async function fetchRepositoryContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<RepositoryFileContent> {
  const params = new URLSearchParams({ owner, repo, path });
  if (branch) params.append('branch', branch);

  const res = await fetch(`${API_BASE}/api/github/content?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    let errorMsg = `Failed to load file content (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<RepositoryFileContent>(json);
}
