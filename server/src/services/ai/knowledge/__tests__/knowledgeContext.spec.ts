const faqFindMany = jest.fn();
const policyFindUnique = jest.fn();
const couponFindMany = jest.fn();
const productFindFirst = jest.fn();
const productFindMany = jest.fn();
const listActiveKnowledgeBaseForAi = jest.fn();
const searchAssistantProductsFromIndex = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    faqItem: { findMany: (...a: unknown[]) => faqFindMany(...a) },
    storePolicySettings: { findUnique: (...a: unknown[]) => policyFindUnique(...a) },
    coupon: { findMany: (...a: unknown[]) => couponFindMany(...a), fields: { usageLimit: "usageLimit-ref" } },
    product: {
      findFirst: (...a: unknown[]) => productFindFirst(...a),
      findMany: (...a: unknown[]) => productFindMany(...a),
    },
  },
}));
jest.mock("../../../knowledge/knowledgeBaseService", () => ({
  listActiveKnowledgeBaseForAi: () => listActiveKnowledgeBaseForAi(),
}));
jest.mock("../../productIndex", () => ({
  searchAssistantProductsFromIndex: (...a: unknown[]) => searchAssistantProductsFromIndex(...a),
}));

import { loadAssistantKnowledgeContext } from "../KnowledgeContextLoader";
import { loadActiveCoupons } from "../loaders/LoadCoupons";
import { loadPolicies } from "../loaders/LoadPolicies";
import { loadKnowledgeDocuments } from "../loaders/LoadKnowledgeDocuments";
import { loadRelevantProducts } from "../loaders/LoadProducts";

const product = (id: string) => ({
  id,
  name: `Lamp ${id}`,
  brand: "Halo",
  description: "Warm light",
  price: 50,
  stock: 2,
  category: "Lighting",
  condition: "NEW",
  discountPercent: null,
});

beforeEach(() => {
  jest.resetAllMocks();
  searchAssistantProductsFromIndex.mockReturnValue(null);
  faqFindMany.mockResolvedValue([]);
  policyFindUnique.mockResolvedValue(null);
  couponFindMany.mockResolvedValue([]);
  productFindMany.mockResolvedValue([]);
  listActiveKnowledgeBaseForAi.mockResolvedValue([]);
});

describe("loaders", () => {
  it("returns empty policies when none are configured", async () => {
    await expect(loadPolicies()).resolves.toEqual({
      returnPolicy: "",
      shippingPolicy: "",
      shipsInternationally: false,
      internationalShippingDetails: "",
      supportEmail: null,
    });
  });

  it("only exposes active, in-window coupons with uses left", async () => {
    await loadActiveCoupons();
    const where = couponFindMany.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.startDate.lte).toBeInstanceOf(Date);
    expect(where.endDate.gte).toBeInstanceOf(Date);
    expect(where.usageCount).toEqual({ lt: "usageLimit-ref" });
    expect(couponFindMany.mock.calls[0][0].select).not.toHaveProperty("usageLimit");
  });

  it("ranks knowledge documents by relevance and keeps relevant older ones", async () => {
    listActiveKnowledgeBaseForAi.mockResolvedValueOnce([
      { id: "new", title: "Careers", sourceType: "MANUAL", content: "We are hiring." },
      { id: "old", title: "Warranty guide", sourceType: "PDF", content: "Electronics carry a 1-year warranty." },
    ]);
    const docs = await loadKnowledgeDocuments("Is there a warranty on electronics?");
    expect(docs.map((d) => d.id)).toEqual(["old"]);
  });

  it("caps document count and total characters", async () => {
    listActiveKnowledgeBaseForAi.mockResolvedValueOnce(
      Array.from({ length: 5 }, (_, i) => ({ id: `k${i}`, title: `Doc ${i}`, sourceType: "PDF", content: "x".repeat(5000) }))
    );
    const docs = await loadKnowledgeDocuments("", 3);
    expect(docs.map((d) => d.id)).toEqual(["k0", "k1"]);
    const total = docs.reduce((sum, d) => sum + d.content.length, 0);
    expect(total).toBeLessThanOrEqual(8002);
    await expect(loadKnowledgeDocuments("anything", 0)).resolves.toEqual([]);
  });

  it("truncates long knowledge documents", async () => {
    listActiveKnowledgeBaseForAi.mockResolvedValueOnce([
      { id: "k1", title: "Long", sourceType: "PDF", content: "a".repeat(5000) },
      { id: "k2", title: "Short", sourceType: "MANUAL", content: "short" },
    ]);
    const docs = await loadKnowledgeDocuments();
    expect(docs[0].content).toHaveLength(4001);
    expect(docs[0].content.endsWith("…")).toBe(true);
    expect(docs[1].content).toBe("short");
  });
});

describe("loadRelevantProducts", () => {
  it("uses the in-memory product index when available", async () => {
    searchAssistantProductsFromIndex.mockReturnValueOnce([product("idx")]);
    await expect(loadRelevantProducts("lamp")).resolves.toEqual([product("idx")]);
    expect(productFindMany).not.toHaveBeenCalled();
  });

  it("puts the focused product first and de-duplicates", async () => {
    productFindFirst.mockResolvedValueOnce(product("p1"));
    productFindMany
      .mockResolvedValueOnce([product("p1"), product("p2"), product("p3")])
      .mockResolvedValueOnce([]);
    const result = await loadRelevantProducts("warm lamp", "p1");
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(productFindFirst.mock.calls[0][0].where).toEqual({ id: "p1", isActive: true, isArchived: false });
  });

  it("ranks DB matches by relevance, not sales order", async () => {
    productFindMany
      .mockResolvedValueOnce([
        { ...product("desc"), name: "Desk Organizer", description: "Fits under a lamp", category: "Office" },
        { ...product("name"), name: "Halo Floor Lamp" },
      ])
      .mockResolvedValueOnce([]);
    const result = await loadRelevantProducts("floor lamp");
    expect(result.map((p) => p.id)).toEqual(["name", "desc"]);
    expect(productFindMany.mock.calls[0][0].take).toBe(24);
  });

  it("skips featured padding when asked (help questions)", async () => {
    const result = await loadRelevantProducts("what is this", undefined, { padWithFeatured: false });
    expect(result).toEqual([]);
    expect(productFindMany).not.toHaveBeenCalled();
    expect(searchAssistantProductsFromIndex).toHaveBeenCalledWith("what is this", undefined, { padWithFeatured: false });
  });

  it("tops up with featured products when few match", async () => {
    // Only stop words → no term search, straight to featured products.
    productFindMany.mockResolvedValueOnce([product("f1"), product("f2"), product("f3")]);
    const result = await loadRelevantProducts("what is this");
    expect(productFindMany).toHaveBeenCalledTimes(1);
    expect(result.map((p) => p.id)).toEqual(["f1", "f2", "f3"]);
    for (const [args] of productFindMany.mock.calls) {
      expect(args.where).toMatchObject({ isActive: true, isArchived: false });
    }
  });
});

describe("loadAssistantKnowledgeContext", () => {
  it("loads every knowledge source", async () => {
    faqFindMany.mockResolvedValueOnce([{ question: "Q", answer: "A", href: null }]);
    const context = await loadAssistantKnowledgeContext("hi");
    expect(Object.keys(context).sort()).toEqual(["coupons", "documents", "faqs", "policies", "products"]);
    expect(context.faqs).toHaveLength(1);
  });

  it("only queries coupons when the shopper asks about savings", async () => {
    await loadAssistantKnowledgeContext("do you sell lamps");
    expect(couponFindMany).not.toHaveBeenCalled();

    couponFindMany.mockResolvedValueOnce([{ code: "SAVE10", discountPercent: 10, minOrderValue: null, maxDiscount: null, isActive: true }]);
    const context = await loadAssistantKnowledgeContext("any discount codes?");
    expect(couponFindMany).toHaveBeenCalledTimes(1);
    expect(context.coupons).toHaveLength(1);
  });

  it("uses the FAQ plan: no featured padding and more FAQ room", async () => {
    faqFindMany.mockResolvedValueOnce(
      Array.from({ length: 12 }, (_, i) => ({ question: `Question ${i}`, answer: "A", href: null }))
    );
    const context = await loadAssistantKnowledgeContext("how do refunds work", undefined, "FAQ");
    expect(context.faqs).toHaveLength(8);
    expect(searchAssistantProductsFromIndex).toHaveBeenCalledWith("how do refunds work", undefined, { padWithFeatured: false });
  });

  it("limits general chat to the most relevant FAQs", async () => {
    faqFindMany.mockResolvedValueOnce([
      ...Array.from({ length: 6 }, (_, i) => ({ question: `Account question ${i}`, answer: "A", href: null })),
      { question: "How long do refunds take?", answer: "5 days.", href: null },
    ]);
    const context = await loadAssistantKnowledgeContext("refunds?");
    expect(context.faqs).toHaveLength(5);
    expect(context.faqs[0].question).toBe("How long do refunds take?");
  });
});
