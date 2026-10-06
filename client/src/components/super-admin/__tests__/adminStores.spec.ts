jest.mock("@/lib/api/adminApiClient", () => ({
  ...jest.requireActual("@/lib/api/adminApiClient"),
  adminApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock("@/lib/http", () => ({ http: { get: jest.fn(), patch: jest.fn() } }));
jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return { __esModule: true, default: { ...actual.default, get: jest.fn(), post: jest.fn(), isAxiosError: actual.isAxiosError } };
});
jest.mock("@/lib/monitoring", () => ({ sentryTracker: jest.fn(), attachAxiosErrorReporting: jest.fn() }));

import axios from "axios";
import { adminApi } from "@/lib/api/adminApiClient";
import { http } from "@/lib/http";
import { useFaqStore } from "../ai/state/useFaqStore";
import { useSupportTicketsStore } from "../ai/state/useSupportTicketsStore";
import { useLeadsStore } from "../ai/leads/state/useLeadsStore";
import { useKnowledgeBaseStore } from "../ai/state/useKnowledgeBaseStore";
import { useKnowledgeStore } from "../ai/knowledge/state/useKnowledgeStore";
import { useReviewAnalyzerStore } from "../ai/state/useReviewAnalyzerStore";
import { useAdminUsersStore } from "../users/state/useAdminUsersStore";
import { useSettingsStore } from "../state/useSettingsStore";

const api = adminApi as unknown as Record<"get" | "post" | "patch" | "put" | "delete", jest.Mock>;
const users = http as unknown as { get: jest.Mock; patch: jest.Mock };
const ax = axios as unknown as { get: jest.Mock; post: jest.Mock };
const ok = (data: unknown) => ({ data: { data } });
const httpError = (status: number, data: unknown) => Object.assign(new Error("HTTP"), { isAxiosError: true, response: { status, data } });

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe("useFaqStore", () => {
  beforeEach(() => useFaqStore.setState({ faqs: [], error: null, isLoading: false }));

  it("creates new FAQs with POST and edits existing ones with PATCH (id stripped from body), then reloads", async () => {
    api.get.mockResolvedValue(ok({ faqs: [{ id: "f1" }] }));
    await expect(useFaqStore.getState().saveFaq({ question: "Q", answer: "A" })).resolves.toBe(true);
    expect(api.post).toHaveBeenCalledWith("/ai/admin/faq", { question: "Q", answer: "A" });

    await useFaqStore.getState().saveFaq({ id: "f1", question: "Q2", answer: "A2" });
    expect(api.patch).toHaveBeenCalledWith("/ai/admin/faq/f1", { question: "Q2", answer: "A2" });
    expect(useFaqStore.getState().faqs).toEqual([{ id: "f1" }]);
  });

  it("reports failures", async () => {
    api.delete.mockRejectedValue(new Error("403"));
    await expect(useFaqStore.getState().deleteFaq("f1")).resolves.toBe(false);
    expect(useFaqStore.getState()).toMatchObject({ error: "Failed to delete FAQ", isLoading: false });
    api.get.mockRejectedValue(new Error("down"));
    await useFaqStore.getState().fetchFaqs();
    expect(useFaqStore.getState().error).toBe("Failed to load FAQ items");
  });
});

describe("useSupportTicketsStore", () => {
  beforeEach(() => useSupportTicketsStore.setState({ tickets: [], error: null }));

  it("filters by status and reloads after closing/replying", async () => {
    api.get.mockResolvedValue(ok({ tickets: [{ id: "t1" }] }));
    await useSupportTicketsStore.getState().fetchTickets("OPEN" as never);
    expect(api.get).toHaveBeenLastCalledWith("/ai/admin/support-tickets?status=OPEN");

    await expect(useSupportTicketsStore.getState().closeTicket("t1")).resolves.toBe(true);
    expect(api.patch).toHaveBeenCalledWith("/ai/admin/support-tickets/t1/close", {});
    expect(api.get).toHaveBeenLastCalledWith("/ai/admin/support-tickets");

    await useSupportTicketsStore.getState().replyToTicket("t1", "Thanks");
    expect(api.post).toHaveBeenCalledWith("/ai/admin/support-tickets/t1/reply", { message: "Thanks" });
  });

  it("returns false when a reply fails", async () => {
    api.post.mockRejectedValue(new Error("x"));
    await expect(useSupportTicketsStore.getState().replyToTicket("t1", "hi")).resolves.toBe(false);
    expect(useSupportTicketsStore.getState().error).toBe("Failed to send reply");
  });
});

describe("useLeadsStore", () => {
  it("loads leads with counts and filters by source", async () => {
    api.get.mockResolvedValue(ok({ leads: [{ id: "l1" }], counts: { total: 1 } }));
    await useLeadsStore.getState().fetchLeads("CHAT" as never);
    expect(api.get).toHaveBeenCalledWith("/leads?source=CHAT");
    expect(useLeadsStore.getState()).toMatchObject({ leads: [{ id: "l1" }], counts: { total: 1 } });
  });

  it("createLead reports failure", async () => {
    api.post.mockRejectedValue(new Error("x"));
    await expect(useLeadsStore.getState().createLead({} as never)).resolves.toBe(false);
    expect(useLeadsStore.getState().error).toBe("Failed to create lead");
  });
});

describe("useKnowledgeBaseStore", () => {
  it("uploads a document with a trimmed title as multipart form data", async () => {
    api.get.mockResolvedValue(ok({ documents: [] }));
    const file = new Blob(["pdf"]) as File;
    await expect(useKnowledgeBaseStore.getState().uploadDocument(file, "  Returns  ")).resolves.toBe(true);
    const [url, form] = api.post.mock.calls[0] as [string, FormData];
    expect(url).toBe("/ai/admin/knowledge-base/upload");
    expect(form.get("title")).toBe("Returns");
    expect(form.get("document")).toBeTruthy();
  });

  it("omits a blank title and reports upload failure", async () => {
    api.post.mockRejectedValue(new Error("413"));
    await expect(useKnowledgeBaseStore.getState().uploadDocument(new Blob(["x"]) as File, "   ")).resolves.toBe(false);
    expect((api.post.mock.calls[0][1] as FormData).has("title")).toBe(false);
    expect(useKnowledgeBaseStore.getState().error).toBe("Failed to upload document");
  });

  it("updates and deletes entries by id", async () => {
    api.get.mockResolvedValue(ok({ documents: [] }));
    await useKnowledgeBaseStore.getState().updateDocument("d1", { title: "T" } as never);
    expect(api.patch).toHaveBeenCalledWith("/ai/admin/knowledge-base/d1", { title: "T" });
    await useKnowledgeBaseStore.getState().deleteDocument("d1");
    expect(api.delete).toHaveBeenCalledWith("/ai/admin/knowledge-base/d1");
  });
});

describe("useKnowledgeStore (policies)", () => {
  it("saves policies and keeps the server's copy", async () => {
    api.put.mockResolvedValue(ok({ policies: { returns: "30 days" } }));
    await expect(useKnowledgeStore.getState().savePolicies({ returns: "30 days" } as never)).resolves.toBe(true);
    expect(useKnowledgeStore.getState().policies).toEqual({ returns: "30 days" });
  });

  it("reports save failure", async () => {
    api.put.mockRejectedValue(new Error("x"));
    await expect(useKnowledgeStore.getState().savePolicies({} as never)).resolves.toBe(false);
    expect(useKnowledgeStore.getState().error).toBe("Failed to save policies");
  });
});

describe("useReviewAnalyzerStore", () => {
  it("uses the selected period for fetch and refresh", async () => {
    api.get.mockResolvedValue(ok({ summary: 1 }));
    api.post.mockResolvedValue(ok({ summary: 2 }));
    useReviewAnalyzerStore.getState().setPeriod("7d" as never);
    await useReviewAnalyzerStore.getState().fetchDashboard();
    expect(api.get).toHaveBeenCalledWith("/ai/admin/review-analyzer?period=7d");
    await useReviewAnalyzerStore.getState().refreshAnalysis();
    expect(api.post).toHaveBeenCalledWith("/ai/admin/review-analyzer/refresh?period=7d");
    expect(useReviewAnalyzerStore.getState().dashboard).toEqual({ summary: 2 });
  });
});

describe("useAdminUsersStore", () => {
  beforeEach(() => useAdminUsersStore.setState({ items: [{ id: "u1", isActive: true, role: "USER" }] as never, error: null }));

  it("loads users with default meta when the payload is missing", async () => {
    users.get.mockResolvedValue({ data: {} });
    await useAdminUsersStore.getState().fetchUsers({ page: 2 } as never);
    expect(users.get.mock.calls[0][1].params).toEqual({ page: 2 });
    expect(useAdminUsersStore.getState()).toMatchObject({ items: [], meta: { page: 1, totalPages: 1 } });
  });

  it("updates status and role in place", async () => {
    users.patch.mockResolvedValueOnce({ data: { data: { isActive: false } } });
    await expect(useAdminUsersStore.getState().setUserStatus("u1", false)).resolves.toBe(true);
    expect(users.patch.mock.calls[0].slice(0, 2)).toEqual(["users/u1/status", { isActive: false }]);
    users.patch.mockResolvedValueOnce({ data: { data: { role: "SELLER" } } });
    await useAdminUsersStore.getState().setUserRole("u1", "SELLER" as never);
    expect(useAdminUsersStore.getState().items[0]).toMatchObject({ isActive: false, role: "SELLER" });
  });

  it("surfaces the server's reason when an admin action is refused", async () => {
    users.patch.mockRejectedValue(httpError(403, { message: "Cannot deactivate yourself" }));
    await expect(useAdminUsersStore.getState().setUserStatus("u1", false)).resolves.toBe(false);
    expect(useAdminUsersStore.getState().error).toBe("Cannot deactivate yourself");
  });
});

describe("useSettingsStore", () => {
  beforeEach(() => useSettingsStore.setState({ error: null, isLoading: false }));

  it("returns true after a successful banner upload", async () => {
    ax.post.mockResolvedValue({ data: { success: true } });
    await expect(useSettingsStore.getState().addBanners([new Blob(["img"]) as File])).resolves.toBe(true);
    expect((ax.post.mock.calls[0][1] as FormData).getAll("images")).toHaveLength(1);
  });

  it("returns false with the server reason when an upload is rejected", async () => {
    ax.post.mockRejectedValue(httpError(400, { message: "Only JPEG, PNG and WebP images are allowed" }));
    await expect(useSettingsStore.getState().addBanners([])).resolves.toBe(false);
    expect(useSettingsStore.getState()).toMatchObject({ isLoading: false, error: "Only JPEG, PNG and WebP images are allowed" });
  });

  it("returns false with an accurate message when featured products fail to save", async () => {
    ax.post.mockRejectedValue(new Error("offline"));
    await expect(useSettingsStore.getState().updateFeaturedProducts(["p1"])).resolves.toBe(false);
    expect(useSettingsStore.getState().error).toBe("Failed to update featured products");
  });

  it("uses a featured-products message for fetch failures", async () => {
    ax.get.mockRejectedValue(new Error("offline"));
    await useSettingsStore.getState().fetchFeaturedProducts();
    expect(useSettingsStore.getState().error).toBe("Failed to fetch featured products");
  });
});
