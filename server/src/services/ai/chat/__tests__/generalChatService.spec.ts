const completeChat = jest.fn();
const isAiConfigured = jest.fn();
const loadAssistantKnowledgeContext = jest.fn();

jest.mock("../../../../config/ai", () => ({
  completeChat: (...a: unknown[]) => completeChat(...a),
  isAiConfigured: () => isAiConfigured(),
  getLlmProviderId: () => "openai",
}));
jest.mock("../../knowledge/KnowledgeContextLoader", () => ({
  loadAssistantKnowledgeContext: (...a: unknown[]) => loadAssistantKnowledgeContext(...a),
}));

import { runGeneralChat } from "../GeneralChatService";

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
    expect(loadAssistantKnowledgeContext).toHaveBeenCalledWith("need a lamp", "p1");
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

  it("adds an FAQ focus to the system prompt", async () => {
    completeChat.mockResolvedValueOnce("Returns within 30 days.");
    await runGeneralChat({ message: "return policy?", history: [], classifiedIntent: "FAQ" });
    expect(completeChat.mock.calls[0][0].messages[0].content).toContain("Answer using FAQs, store policies, and help content first.");
  });

  it("propagates provider failures", async () => {
    completeChat.mockRejectedValueOnce(new Error("rate limited"));
    await expect(runGeneralChat({ message: "hi", history: [], classifiedIntent: "GENERAL_CHAT" })).rejects.toThrow("rate limited");
  });
});
