import { API_ROUTES } from "@/lib/routes/api";
import axios from "axios";
import { create } from "zustand";

export type SupportTicketMessage = {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  createdAt: string;
};

export type SupportTicketRecord = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  status: "OPEN" | "CLOSED";
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
};

type TicketStatusFilter = "all" | "OPEN" | "CLOSED";

interface SupportTicketsState {
  tickets: SupportTicketRecord[];
  isLoading: boolean;
  error: string | null;
  fetchTickets: (status?: TicketStatusFilter) => Promise<void>;
  closeTicket: (id: string) => Promise<boolean>;
  replyToTicket: (id: string, message: string) => Promise<boolean>;
}

const authConfig = { withCredentials: true as const };

function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data as T;
}

export const useSupportTicketsStore = create<SupportTicketsState>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  fetchTickets: async (status = "all") => {
    set({ isLoading: true, error: null });
    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const response = await axios.get(
        `${API_ROUTES.AI}/admin/support-tickets${query}`,
        authConfig,
      );
      const data = unwrapData<{ tickets: SupportTicketRecord[] }>(response);
      set({ tickets: data.tickets, isLoading: false });
    } catch {
      set({ error: "Failed to load support tickets", isLoading: false });
    }
  },

  closeTicket: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.patch(
        `${API_ROUTES.AI}/admin/support-tickets/${id}/close`,
        {},
        authConfig,
      );
      await get().fetchTickets("all");
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to close ticket", isLoading: false });
      return false;
    }
  },

  replyToTicket: async (id, message) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(
        `${API_ROUTES.AI}/admin/support-tickets/${id}/reply`,
        { message },
        authConfig,
      );
      await get().fetchTickets("all");
      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "Failed to send reply", isLoading: false });
      return false;
    }
  },
}));
