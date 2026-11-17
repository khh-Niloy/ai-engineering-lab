import { DocumentItem, SearchResponse, QAItem } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function extractData<T>(json: any): T {
  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    json.data !== undefined
  ) {
    return json.data as T;
  }
  return json as T;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/document`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load documents: ${res.statusText}`);
  }
  const json = await res.json();
  return extractData<DocumentItem[]>(json);
}

export async function fetchDocument(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/document/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }
  const json = await res.json();
  return extractData<DocumentItem>(json);
}

export async function uploadDocument(
  file: File,
): Promise<{ message: string; document: DocumentItem; totalChunks?: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/document/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = `Upload failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(", ")
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<{
    message: string;
    document: DocumentItem;
    totalChunks?: number;
  }>(json);
}

export async function searchDocument(
  query: string,
  documentId: string,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      documentId,
    }),
  });

  if (!res.ok) {
    let errorMsg = `Search failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(", ")
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
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load Q&A history: ${res.statusText}`);
  }
  const json = await res.json();
  return extractData<QAItem[]>(json);
}

export async function deleteQna(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/qna/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete Q&A item: ${res.statusText}`);
  }
}
