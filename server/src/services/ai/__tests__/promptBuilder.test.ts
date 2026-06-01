import {
  buildAssistantSystemPrompt,
  buildChatMessages,
} from "../promptBuilder";
import type { AssistantKnowledgeContext } from "../types";

const baseContext: AssistantKnowledgeContext = {
  faqs: [
    {
      question: "What is your return policy?",
      answer: "30-day returns on most items.",
      href: null,
    },
  ],
  policies: {
    returnPolicy: "30-day returns.",
    shippingPolicy: "3–7 business days domestically.",
    shipsInternationally: true,
    internationalShippingDetails: "Select countries only.",
    supportEmail: "support@example.com",
  },
  products: [
    {
      id: "prod-1",
      name: "Nebula X1",
      brand: "samsung",
      description: "Flagship smartphone.",
      price: 999,
      stock: 12,
      category: "Electronics",
      condition: "NEW",
      discountPercent: 10,
    },
  ],
  coupons: [
    {
      code: "SAVE10",
      discountPercent: 10,
      minOrderValue: 50,
      maxDiscount: 25,
      isActive: true,
    },
  ],
  documents: [
    {
      id: "doc-1",
      title: "Warranty guide",
      sourceType: "PDF" as const,
      content: "All electronics include a 1-year warranty.",
    },
  ],
};

describe("promptBuilder", () => {
  it("includes policies, FAQ, products, and coupons in the system prompt", () => {
    const prompt = buildAssistantSystemPrompt(baseContext);

    expect(prompt).toContain("30-day returns");
    expect(prompt).toContain("What is your return policy?");
    expect(prompt).toContain("[prod-1] Nebula X1");
    expect(prompt).toContain("SAVE10");
    expect(prompt).toContain("Warranty guide");
    expect(prompt).toContain("International shipping: Yes");
  });

  it("builds chat messages with trimmed history", () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      role: "user" as const,
      content: `message ${i}`,
    }));

    const messages = buildChatMessages("system", "hello", history);

    expect(messages[0].role).toBe("system");
    expect(messages[messages.length - 1]).toEqual({
      role: "user",
      content: "hello",
    });
    expect(messages.filter((m) => m.role === "user").length).toBe(9);
  });
});
