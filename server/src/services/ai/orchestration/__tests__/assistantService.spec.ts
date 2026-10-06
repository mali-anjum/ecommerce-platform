const getProductRecommendations = jest.fn();
const parseRecommendationFilters = jest.fn();
const buildRecommendationReply = jest.fn();
const runLeadCaptureChat = jest.fn();
const runOrderSupportChat = jest.fn();
const runGeneralChat = jest.fn();
const classifyIntent = jest.fn();
const handleOpenTicketMessage = jest.fn();
const incrementSessionFailureCount = jest.fn();
const resetSessionFailureCount = jest.fn();
const runHumanHandoffChat = jest.fn();
const shouldEscalateToHuman = jest.fn();
const isAssistantFailureReply = jest.fn();
const loadSessionHistory = jest.fn();
const isFeatureEnabled = jest.fn();

jest.mock("../../recommendations/ProductRecommendationService", () => ({
  getProductRecommendations: (...a: unknown[]) => getProductRecommendations(...a),
}));
jest.mock("../../classification/parsers/RecommendationParser", () => ({
  parseRecommendationFilters: (...a: unknown[]) => parseRecommendationFilters(...a),
}));
jest.mock("../../recommendations/RecommendationReply", () => ({
  buildRecommendationReply: (...a: unknown[]) => buildRecommendationReply(...a),
}));
jest.mock("../../leads/LeadCaptureService", () => ({ runLeadCaptureChat: (...a: unknown[]) => runLeadCaptureChat(...a) }));
jest.mock("../../orders/OrderSupportService", () => ({ runOrderSupportChat: (...a: unknown[]) => runOrderSupportChat(...a) }));
jest.mock("../../chat/GeneralChatService", () => ({ runGeneralChat: (...a: unknown[]) => runGeneralChat(...a) }));
jest.mock("../../classification/IntentClassifier", () => ({
  classifyIntent: (...a: unknown[]) => classifyIntent(...a),
  mapClassifiedIntentToLegacy: (intent: string) => (intent === "FAQ" ? "general" : "general"),
}));
jest.mock("../../handoff/HandoffService", () => ({
  handleOpenTicketMessage: (...a: unknown[]) => handleOpenTicketMessage(...a),
  incrementSessionFailureCount: (...a: unknown[]) => incrementSessionFailureCount(...a),
  resetSessionFailureCount: (...a: unknown[]) => resetSessionFailureCount(...a),
  runHumanHandoffChat: (...a: unknown[]) => runHumanHandoffChat(...a),
  shouldEscalateToHuman: (...a: unknown[]) => shouldEscalateToHuman(...a),
}));
jest.mock("../../classification/parsers/HandoffParser", () => ({
  isAssistantFailureReply: (...a: unknown[]) => isAssistantFailureReply(...a),
}));
jest.mock("../../sessionMemory/SessionMemoryService", () => ({
  loadSessionHistory: (...a: unknown[]) => loadSessionHistory(...a),
  mergeSessionHistory: (server: unknown[], client: unknown[] = []) => [...server, ...client],
}));
jest.mock("../../../../config/featureFlags", () => ({ isFeatureEnabled: (key: string) => isFeatureEnabled(key) }));

import { runAssistantChat } from "../AssistantService";

const general = { intent: "general", reply: "Our return window is 30 days.", products: [], productIdsReferenced: [], orders: [] };
const base = { message: "  hello  ", userId: "u1", userRole: "USER", sessionId: "s1" };

beforeEach(() => {
  jest.clearAllMocks();
  isFeatureEnabled.mockReturnValue(true);
  loadSessionHistory.mockResolvedValue([]);
  handleOpenTicketMessage.mockResolvedValue(null);
  shouldEscalateToHuman.mockResolvedValue({ escalate: false });
  runGeneralChat.mockResolvedValue(general);
  isAssistantFailureReply.mockReturnValue(false);
});

describe("runAssistantChat", () => {
  it("loads session history for the requesting user and trims the message", async () => {
    classifyIntent.mockReturnValue({ intent: "GENERAL_CHAT" });
    await runAssistantChat({ ...base, history: [{ role: "user", content: "earlier" }] });
    expect(loadSessionHistory).toHaveBeenCalledWith("s1", "u1");
    expect(classifyIntent).toHaveBeenCalledWith({ message: "hello", leadSession: undefined });
    expect(runGeneralChat.mock.calls[0][0].history).toEqual([{ role: "user", content: "earlier" }]);
  });

  it("routes messages to an open support ticket first", async () => {
    handleOpenTicketMessage.mockResolvedValueOnce({ classifiedIntent: "HUMAN_HANDOFF", reply: "added" });
    const result = await runAssistantChat(base);
    expect(result).toMatchObject({ reply: "added", sessionId: "s1" });
    expect(classifyIntent).not.toHaveBeenCalled();
  });

  it("escalates to a human when requested", async () => {
    shouldEscalateToHuman.mockResolvedValueOnce({ escalate: true, reason: "user_request" });
    runHumanHandoffChat.mockResolvedValueOnce({ classifiedIntent: "HUMAN_HANDOFF", reply: "ticket opened" });
    const result = await runAssistantChat(base);
    expect(runHumanHandoffChat).toHaveBeenCalledWith({ message: "hello", userId: "u1", sessionId: "s1", reason: "user_request" });
    expect(result.reply).toBe("ticket opened");
  });

  it("skips handoff checks when the feature is off", async () => {
    isFeatureEnabled.mockImplementation((key: string) => key !== "ai.humanHandoff");
    classifyIntent.mockReturnValue({ intent: "GENERAL_CHAT" });
    await runAssistantChat(base);
    expect(handleOpenTicketMessage).not.toHaveBeenCalled();
    expect(shouldEscalateToHuman).not.toHaveBeenCalled();
  });

  it("passes the authenticated identity to order support", async () => {
    classifyIntent.mockReturnValue({ intent: "ORDER_SUPPORT" });
    runOrderSupportChat.mockResolvedValueOnce({
      intent: "order_support",
      reply: "Your order shipped",
      orders: [{ id: "o1" }],
      orderSupportIntent: "status",
      requiresAuth: false,
    });
    const result = await runAssistantChat({ ...base, orderId: "o1" });
    expect(runOrderSupportChat).toHaveBeenCalledWith({ message: "hello", userId: "u1", userRole: "USER", orderId: "o1" });
    expect(result).toMatchObject({ classifiedIntent: "ORDER_SUPPORT", productIdsReferenced: ["o1"], orders: [{ id: "o1" }] });
  });

  it("explains when a sub-feature is disabled", async () => {
    isFeatureEnabled.mockImplementation((key: string) => key !== "ai.orderSupport");
    classifyIntent.mockReturnValue({ intent: "ORDER_SUPPORT" });
    const result = await runAssistantChat(base);
    expect(runOrderSupportChat).not.toHaveBeenCalled();
    expect(result.reply).toBe(`Order support is not available on this store right now. ${general.reply}`);
    expect(result.classifiedIntent).toBe("GENERAL_CHAT");
  });

  it("builds product recommendations", async () => {
    classifyIntent.mockReturnValue({ intent: "PRODUCT_SEARCH" });
    parseRecommendationFilters.mockReturnValueOnce({ maxPrice: 50 });
    getProductRecommendations.mockResolvedValueOnce({ products: [{ id: "p1" }], filtersApplied: { maxPrice: 50 } });
    buildRecommendationReply.mockReturnValueOnce("Here is 1 pick");
    const result = await runAssistantChat(base);
    expect(getProductRecommendations).toHaveBeenCalledWith("hello", { maxPrice: 50 });
    expect(result).toMatchObject({ intent: "product_recommendation", reply: "Here is 1 pick", productIdsReferenced: ["p1"] });
  });

  it("falls back to general chat when lead capture has nothing to do", async () => {
    classifyIntent.mockReturnValue({ intent: "LEAD" });
    runLeadCaptureChat.mockResolvedValueOnce(null);
    const result = await runAssistantChat(base);
    expect(result.classifiedIntent).toBe("GENERAL_CHAT");
    expect(runGeneralChat).toHaveBeenCalled();
  });

  it("returns lead capture replies", async () => {
    classifyIntent.mockReturnValue({ intent: "LEAD" });
    runLeadCaptureChat.mockResolvedValueOnce({ intent: "lead_capture", reply: "What's your email?", products: [], productIdsReferenced: [], orders: [] });
    const result = await runAssistantChat({ ...base, leadSession: { active: true } });
    expect(result).toMatchObject({ classifiedIntent: "LEAD", reply: "What's your email?" });
  });

  it("focuses FAQ questions on store knowledge", async () => {
    classifyIntent.mockReturnValue({ intent: "FAQ" });
    const result = await runAssistantChat({ ...base, productId: "p1" });
    expect(runGeneralChat.mock.calls[0][0]).toMatchObject({ classifiedIntent: "FAQ", productId: "p1" });
    expect(result.classifiedIntent).toBe("FAQ");
  });

  it("counts assistant failures and resets on success", async () => {
    classifyIntent.mockReturnValue({ intent: "GENERAL_CHAT" });
    isAssistantFailureReply.mockReturnValueOnce(true);
    await runAssistantChat(base);
    expect(incrementSessionFailureCount).toHaveBeenCalledWith("s1");

    await runAssistantChat(base);
    expect(resetSessionFailureCount).toHaveBeenCalledWith("s1");
  });

  it("propagates LLM configuration errors", async () => {
    classifyIntent.mockReturnValue({ intent: "GENERAL_CHAT" });
    runGeneralChat.mockRejectedValueOnce(Object.assign(new Error("LLM not configured"), { statusCode: 503 }));
    await expect(runAssistantChat(base)).rejects.toMatchObject({ statusCode: 503 });
  });
});
