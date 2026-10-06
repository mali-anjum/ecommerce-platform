const completeChat = jest.fn();
const isAiConfigured = jest.fn();
const loadAssistantKnowledgeContext = jest.fn();
const sentryTracker = jest.fn();

jest.mock("../../../../config/ai", () => ({
  completeChat: (...a: unknown[]) => completeChat(...a),
  isAiConfigured: () => isAiConfigured(),
  getLlmProviderId: () => "openai",
}));
jest.mock("../../../../lib/monitoring", () => ({
  sentryTracker: (...a: unknown[]) => sentryTracker(...a),
}));
jest.mock("../../knowledge/KnowledgeContextLoader", () => ({
  loadAssistantKnowledgeContext: (...a: unknown[]) => loadAssistantKnowledgeContext(...a),
}));

import { GENERAL_CHAT_FALLBACK_REPLY, runGeneralChat } from "../GeneralChatService";
import { isAssistantFailureReply } from "../../classification/parsers/HandoffParser";

const context = {
  faqs: [],
  policies: { returnPolicy: "30 days", shippingPolicy: "", shipsInternationally: false, internationalShippingDetails: "", supportEmail: null },
  products: [
    { id: "p1", name: "Halo Floor Lamp", brand: "Halo", description: "", price: 90, stock: 3, category: "Lighting", condition: "NEW", discountPercent: null },
    { id: "p2", name: "Nova Chef Knife Set", brand: "Nova", description: "", price: 60, stock: 1, category: "Kitchen", condition: "NEW", discountPercent: null },
  ],
  coupons: [],
  documents: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  isAiConfigured.mockReturnValue(true);
  loadAssistantKnowledgeContext.mockResolvedValue(context);
});

describe("runGeneralChat", () => {
  it("returns 503 when no LLM is configured", async () => {
    isAiConfigured.mockReturnValue(false);
    await expect(runGeneralChat({ message: "hi", history: [], classifiedIntent: "GENERAL_CHAT" })).rejects.toMatchObject({ statusCode: 503 });
    expect(completeChat).not.toHaveBeenCalled();
  });

  it("sends a system prompt, history and the message, and detects referenced products", async () => {
    completeChat.mockResolvedValueOnce("The halo floor lamp is a great pick.");
    const result = await runGeneralChat({
      message: "need a lamp",
      productId: "p1",
      history: [{ role: "user", content: "hello" }],
      classifiedIntent: "GENERAL_CHAT",
    });
    expect(loadAssistantKnowledgeContext).toHaveBeenCalledWith("need a lamp", "p1", "GENERAL_CHAT");
    const { messages, temperature, maxTokens } = completeChat.mock.calls[0][0];
    expect(messages[0].role).toBe("system");
    expect(messages.at(-1)).toEqual({ role: "user", content: "need a lamp" });
    expect(messages.some((m: { content: string }) => m.content === "hello")).toBe(true);
    expect({ temperature, maxTokens }).toEqual({ temperature: 0.3, maxTokens: 800 });
    expect(result).toEqual({
      intent: "general",
      reply: "The halo floor lamp is a great pick.",
      products: [],
      productIdsReferenced: ["p1"],
      orders: [],
    });
  });

  it("passes the FAQ intent to context loading and uses the FAQ task in the prompt", async () => {
    completeChat.mockResolvedValueOnce("Returns within 30 days.");
    await runGeneralChat({ message: "return policy?", history: [], classifiedIntent: "FAQ" });
    expect(loadAssistantKnowledgeContext).toHaveBeenCalledWith("return policy?", undefined, "FAQ");
    expect(completeChat.mock.calls[0][0].messages[0].content).toContain(
      "Answer from the store policies, FAQ, and knowledge base first."
    );
  });

  it("returns a failure-flagged fallback and reports to Sentry when the provider fails", async () => {
    const error = new Error("rate limited");
    completeChat.mockRejectedValueOnce(error);
    const result = await runGeneralChat({ message: "hi", history: [], classifiedIntent: "GENERAL_CHAT" });
    expect(result).toEqual({
      intent: "general",
      reply: GENERAL_CHAT_FALLBACK_REPLY,
      products: [],
      productIdsReferenced: [],
      orders: [],
    });
    // Must be recognised so repeated failures escalate to a human.
    expect(isAssistantFailureReply(result.reply)).toBe(true);
    expect(sentryTracker).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ source: "ai.generalChat", extra: { provider: "openai", intent: "GENERAL_CHAT" } })
    );
  });

  it("falls back on a blank completion without referencing products", async () => {
    completeChat.mockResolvedValueOnce("   ");
    const result = await runGeneralChat({ message: "lamp?", history: [], classifiedIntent: "GENERAL_CHAT" });
    expect(result.reply).toBe(GENERAL_CHAT_FALLBACK_REPLY);
    expect(result.productIdsReferenced).toEqual([]);
    expect(sentryTracker).not.toHaveBeenCalled();
  });
});
