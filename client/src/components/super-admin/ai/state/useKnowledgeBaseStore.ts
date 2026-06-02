import {
  adminApi,
  AI_ADMIN_ROUTES,
  unwrapData,
} from "@/lib/api/adminApiClient";
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

export const useKnowledgeBaseStore = create<KnowledgeBaseState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get(AI_ADMIN_ROUTES.knowledgeBase);
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
      await adminApi.post(AI_ADMIN_ROUTES.knowledgeBaseUpload, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      await adminApi.post(AI_ADMIN_ROUTES.knowledgeBase, payload);
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
      await adminApi.patch(`${AI_ADMIN_ROUTES.knowledgeBase}/${id}`, payload);
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
      await adminApi.delete(`${AI_ADMIN_ROUTES.knowledgeBase}/${id}`);
      await get().fetchDocuments();
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to delete entry", isLoading: false });
      return false;
    }
  },
}));
