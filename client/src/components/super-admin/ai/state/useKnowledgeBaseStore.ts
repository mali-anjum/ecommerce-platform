import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";

export type KnowledgeBaseRecord = {
  id: string;
  title: string;
  content: string;
  sourceType: "PDF" | "MANUAL";
  fileUrl: string | null;
  fileName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

interface KnowledgeBaseState {
  documents: KnowledgeBaseRecord[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, title?: string) => Promise<boolean>;
  createManual: (payload: {
    title: string;
    content: string;
    isActive?: boolean;
  }) => Promise<boolean>;
  updateDocument: (
    id: string,
    payload: { title?: string; content?: string; isActive?: boolean },
  ) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
}

const authConfig = { withCredentials: true as const };

function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_ROUTES.AI}/admin/knowledge-base`,
        authConfig,
      );
      const data = unwrapData<{ documents: KnowledgeBaseRecord[] }>(response);
      set({ documents: data.documents, isLoading: false });
    } catch {
      set({ error: "Failed to load knowledge base", isLoading: false });
    }
  },

  uploadDocument: async (file, title) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("document", file);
      if (title?.trim()) {
        formData.append("title", title.trim());
      }
      await axios.post(
        `${API_ROUTES.AI}/admin/knowledge-base/upload`,
        formData,
        {
          ...authConfig,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      await get().fetchDocuments();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to upload document", isLoading: false });
      return false;
    }
  },

  createManual: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_ROUTES.AI}/admin/knowledge-base`, payload, authConfig);
      await get().fetchDocuments();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to create entry", isLoading: false });
      return false;
    }
  },

  updateDocument: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      await axios.patch(
        `${API_ROUTES.AI}/admin/knowledge-base/${id}`,
        payload,
        authConfig,
      );
      await get().fetchDocuments();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to update entry", isLoading: false });
      return false;
    }
  },

  deleteDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(
        `${API_ROUTES.AI}/admin/knowledge-base/${id}`,
        authConfig,
      );
      await get().fetchDocuments();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to delete entry", isLoading: false });
      return false;
    }
  },
}));
