import type { NextFunction, Response } from "express";

const ai = {
  runAssistantChat: jest.fn(),
  toPublicChatPayload: jest.fn((r: { reply: string }) => ({ reply: r.reply })),
  scheduleAiConversationLog: jest.fn(),
  persistSessionTurn: jest.fn(),
  fetchAiAnalyticsDashboard: jest.fn(),
};
const sales = {
  captureGuestEmailForSales: jest.fn(),
  dismissOffer: jest.fn(),
  fetchSalesAgentAdminDashboard: jest.fn(),
  getPendingOffersForSession: jest.fn(),
  getSalesAgentContext: jest.fn(),
  markOfferShown: jest.fn(),
  scheduleSalesAgentEvaluation: jest.fn(),
};
const scheduleAnalyticsEvent = jest.fn();
const getSetupRecommendations = jest.fn();
const runSmartSearch = jest.fn();
const isSmartSearchQuery = jest.fn();
const generateSeoContent = jest.fn();
const buildReviewAnalyzerReport = jest.fn();
const fetchAnalyticsDashboard = jest.fn();
const sentryTracker = jest.fn();

jest.mock("../../lib/monitoring", () => ({ sentryTracker: (...a: unknown[]) => sentryTracker(...a) }));
jest.mock("../../services/ai", () => ai);
jest.mock("../../services/ai/sales", () => sales);
jest.mock("../../services/analytics/analyticsEventService", () => ({
  scheduleAnalyticsEvent: (...a: unknown[]) => scheduleAnalyticsEvent(...a),
}));
jest.mock("../../services/ai/recommendations/SetupRecommendationService", () => ({
  getSetupRecommendations: (...a: unknown[]) => getSetupRecommendations(...a),
}));
jest.mock("../../services/ai/search", () => ({
  runSmartSearch: (...a: unknown[]) => runSmartSearch(...a),
  isSmartSearchQuery: (...a: unknown[]) => isSmartSearchQuery(...a),
}));
jest.mock("../../services/ai/seo", () => ({ generateSeoContent: (...a: unknown[]) => generateSeoContent(...a) }));
jest.mock("../../services/ai/reviews", () => ({
  buildReviewAnalyzerReport: (...a: unknown[]) => buildReviewAnalyzerReport(...a),
}));
jest.mock("../../services/analytics/analyticsService", () => ({
  fetchAnalyticsDashboard: (...a: unknown[]) => fetchAnalyticsDashboard(...a),
}));

import { postAiChat } from "../aiController";
import { getAiSetupRecommendations } from "../recommendationController";
import { postSmartSearch } from "../smartSearchController";
import { postAdminSeoContentGenerate } from "../seoGeneratorController";
import { getAdminReviewAnalyzerDashboard, postAdminReviewAnalyzerRefresh } from "../reviewAnalyzerController";
import { getAiAnalyticsDashboard } from "../aiAnalyticsController";
import * as salesController from "../salesAgentController";
import { getAnalyticsDashboard } from "../analyticsController";
import { postAnalyticsEvent } from "../analyticsEventController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: (req: never, res: Response, next: NextFunction) => unknown, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, query: {}, body: {}, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

const SESSION = "6f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const PRODUCT = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("postAiChat", () => {
  const result = { reply: "Hi!", classifiedIntent: "GENERAL_CHAT", supportTicket: null };

  it("runs the assistant with the caller's identity and logs analytics", async () => {
    ai.runAssistantChat.mockResolvedValueOnce(result);
    ai.persistSessionTurn.mockResolvedValueOnce([]);
    const { res } = await run(postAiChat, {
      user: { userId: "u1", email: "a@b.co", role: "USER" },
      validatedData: { message: "hello", sessionId: SESSION, productId: PRODUCT },
    });
    expect(ai.runAssistantChat).toHaveBeenCalledWith(expect.objectContaining({ message: "hello", userId: "u1", userRole: "USER", sessionId: SESSION }));
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "CHAT", userId: "u1", sessionId: SESSION }));
    expect(ai.persistSessionTurn).toHaveBeenCalledWith({ sessionId: SESSION, userId: "u1", userMessage: "hello", assistantReply: "Hi!" });
    expect(res.json.mock.calls[0][0].data).toEqual({ reply: "Hi!" });
  });

  it("does not persist turns without a session", async () => {
    ai.runAssistantChat.mockResolvedValueOnce(result);
    await run(postAiChat, { validatedData: { message: "hello" } });
    expect(ai.persistSessionTurn).not.toHaveBeenCalled();
  });

  it("still replies when persisting the turn fails", async () => {
    ai.runAssistantChat.mockResolvedValueOnce(result);
    ai.persistSessionTurn.mockRejectedValueOnce(new Error("db"));
    const { res } = await run(postAiChat, { validatedData: { message: "hello", sessionId: SESSION } });
    await new Promise((r) => setImmediate(r));
    expect(res.json).toHaveBeenCalled();
    expect(sentryTracker).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ route: "persistSessionTurn" }));
  });

  it("passes assistant errors to the error handler", async () => {
    ai.runAssistantChat.mockRejectedValueOnce(Object.assign(new Error("LLM down"), { statusCode: 503 }));
    const { next } = await run(postAiChat, { validatedData: { message: "hello" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 503 });
  });
});

describe("getAiSetupRecommendations", () => {
  it("rejects invalid queries", async () => {
    const { next } = await run(getAiSetupRecommendations, { query: { productId: "not-a-uuid" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("returns setup recommendations", async () => {
    getSetupRecommendations.mockResolvedValueOnce({ setupTitle: "Desk setup" });
    const { res } = await run(getAiSetupRecommendations, { query: { productId: PRODUCT, sessionId: SESSION }, user: { userId: "u1" } });
    expect(getSetupRecommendations).toHaveBeenCalledWith({ productId: PRODUCT, sessionId: SESSION, userId: "u1", visitorId: undefined });
    expect(res.json.mock.calls[0][0].message).toBe("Setup recommendations loaded");
  });

  it("reports when there are none", async () => {
    getSetupRecommendations.mockResolvedValueOnce(null);
    const { res } = await run(getAiSetupRecommendations, { query: { productId: PRODUCT } });
    expect(res.json.mock.calls[0][0].message).toBe("No setup recommendations");
  });
});

describe("postSmartSearch", () => {
  it("asks for a fuller description for vague short queries", async () => {
    isSmartSearchQuery.mockReturnValueOnce(false);
    const { next } = await run(postSmartSearch, { validatedData: { query: "mouse" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(runSmartSearch).not.toHaveBeenCalled();
  });

  it("runs descriptive queries", async () => {
    isSmartSearchQuery.mockReturnValueOnce(false);
    runSmartSearch.mockResolvedValueOnce({ products: [] });
    await run(postSmartSearch, { validatedData: { query: "quiet keyboard for office", limit: 12 } });
    expect(runSmartSearch).toHaveBeenCalledWith("quiet keyboard for office", { limit: 12 });
  });
});

describe("admin AI controllers", () => {
  it("generates SEO content from validated fields only", async () => {
    generateSeoContent.mockResolvedValueOnce({ title: "T" });
    await run(postAdminSeoContentGenerate, { validatedData: { productName: "Lamp", tone: "friendly", extra: "x" } });
    expect(generateSeoContent).toHaveBeenCalledWith({ productName: "Lamp", category: undefined, brand: undefined, tone: "friendly", storeName: undefined });
  });

  it.each([
    ["review dashboard", getAdminReviewAnalyzerDashboard, buildReviewAnalyzerReport],
    ["review refresh", postAdminReviewAnalyzerRefresh, buildReviewAnalyzerReport],
    ["AI analytics", getAiAnalyticsDashboard, ai.fetchAiAnalyticsDashboard],
    ["sales dashboard", salesController.getAdminSalesAgentDashboard, sales.fetchSalesAgentAdminDashboard],
    ["store analytics", getAnalyticsDashboard, fetchAnalyticsDashboard],
  ])("%s passes the period through", async (_name, handler, service) => {
    (service as jest.Mock).mockResolvedValueOnce({ ok: true });
    const { res } = await run(handler, { query: { period: "30d" } });
    expect(service).toHaveBeenCalledWith("30d");
    expect(res.json.mock.calls[0][0].data).toEqual({ ok: true });
  });
});

describe("salesAgentController", () => {
  it.each([
    ["getSalesOffers", salesController.getSalesOffers],
    ["getSalesContext", salesController.getSalesContext],
  ])("%s rejects an invalid sessionId", async (_name, handler) => {
    const { next } = await run(handler, { query: { sessionId: "nope" } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Invalid sessionId" });
  });

  it("loads pending offers and context", async () => {
    sales.getPendingOffersForSession.mockResolvedValueOnce([{ id: "o1" }]);
    const offers = await run(salesController.getSalesOffers, { query: { sessionId: SESSION } });
    expect(offers.res.json.mock.calls[0][0].data).toEqual({ offers: [{ id: "o1" }] });

    sales.getSalesAgentContext.mockResolvedValueOnce({ score: 3 });
    await run(salesController.getSalesContext, { query: { sessionId: SESSION, visitorId: SESSION }, user: { userId: "u1" } });
    expect(sales.getSalesAgentContext).toHaveBeenCalledWith({ sessionId: SESSION, userId: "u1", visitorId: SESSION });
  });

  it("captures guest emails and acknowledges offer actions", async () => {
    sales.captureGuestEmailForSales.mockResolvedValueOnce({ scheduled: true });
    await run(salesController.postCaptureGuestEmail, { validatedData: { sessionId: SESSION, email: "a@b.co" } });
    expect(sales.captureGuestEmailForSales).toHaveBeenCalledWith({ sessionId: SESSION, email: "a@b.co", visitorId: undefined, userId: undefined });

    const shown = await run(salesController.postSalesOfferShown, { params: { id: "o1" }, validatedData: { sessionId: SESSION } });
    expect(sales.markOfferShown).toHaveBeenCalledWith("o1", SESSION);
    expect(shown.res.json.mock.calls[0][0].data).toEqual({ acknowledged: true });

    await run(salesController.postSalesOfferDismiss, { params: { id: "o1" }, validatedData: { sessionId: SESSION } });
    expect(sales.dismissOffer).toHaveBeenCalledWith("o1", SESSION);
  });
});

describe("postAnalyticsEvent", () => {
  it("accepts the event with 202 and schedules sales evaluation for sessions", async () => {
    const { res } = await run(postAnalyticsEvent, {
      user: { userId: "u1" },
      validatedData: { type: "PRODUCT_VIEW", sessionId: SESSION, metadata: { visitorId: "v1", productId: "p1" } },
    });
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith({
      type: "PRODUCT_VIEW",
      userId: "u1",
      sessionId: SESSION,
      metadata: { visitorId: "v1", productId: "p1" },
    });
    expect(sales.scheduleSalesAgentEvaluation).toHaveBeenCalledWith({ sessionId: SESSION, userId: "u1", visitorId: "v1" });
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("skips sales evaluation without a session and ignores non-string visitor ids", async () => {
    await run(postAnalyticsEvent, { validatedData: { type: "SESSION_PING", metadata: { visitorId: 5 } } });
    expect(sales.scheduleSalesAgentEvaluation).not.toHaveBeenCalled();
  });
});
