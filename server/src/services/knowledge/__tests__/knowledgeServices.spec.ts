const faqFindMany = jest.fn();
const faqCreate = jest.fn();
const faqUpdate = jest.fn();
const faqDelete = jest.fn();
const policyUpsert = jest.fn();
const policyUpdate = jest.fn();
const kbFindMany = jest.fn();
const kbCreate = jest.fn();
const kbUpdate = jest.fn();
const kbDelete = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    faqItem: {
      findMany: (...a: unknown[]) => faqFindMany(...a),
      create: (...a: unknown[]) => faqCreate(...a),
      update: (...a: unknown[]) => faqUpdate(...a),
      delete: (...a: unknown[]) => faqDelete(...a),
    },
    storePolicySettings: {
      upsert: (...a: unknown[]) => policyUpsert(...a),
      update: (...a: unknown[]) => policyUpdate(...a),
    },
    knowledgeBase: {
      findMany: (...a: unknown[]) => kbFindMany(...a),
      create: (...a: unknown[]) => kbCreate(...a),
      update: (...a: unknown[]) => kbUpdate(...a),
      delete: (...a: unknown[]) => kbDelete(...a),
    },
  },
}));

import {
  createFaqItem,
  deleteFaqItem,
  getStorePolicies,
  listAllFaqsForAdmin,
  listPublicFaqs,
  updateFaqItem,
  updateStorePolicies,
} from "../knowledgeService";
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  listActiveKnowledgeBaseForAi,
  listKnowledgeBaseForAdmin,
  updateKnowledgeBaseEntry,
} from "../knowledgeBaseService";

beforeEach(() => jest.clearAllMocks());

describe("knowledgeService FAQs", () => {
  it("lists only active FAQs publicly, ordered, without admin fields", async () => {
    await listPublicFaqs();
    const args = faqFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ isActive: true });
    expect(args.orderBy).toEqual([{ sortOrder: "asc" }, { createdAt: "asc" }]);
    expect(args.select).not.toHaveProperty("isActive");
  });

  it("lists every FAQ for admins", async () => {
    await listAllFaqsForAdmin();
    expect(faqFindMany.mock.calls[0][0]).not.toHaveProperty("where");
  });

  it("creates with defaults", async () => {
    await createFaqItem({ question: "Q", answer: "A" });
    expect(faqCreate).toHaveBeenCalledWith({ data: { question: "Q", answer: "A", href: null, sortOrder: 0, isActive: true } });
  });

  it("updates and deletes by id", async () => {
    await updateFaqItem("f1", { isActive: false });
    expect(faqUpdate).toHaveBeenCalledWith({ where: { id: "f1" }, data: { isActive: false } });
    await deleteFaqItem("f1");
    expect(faqDelete).toHaveBeenCalledWith({ where: { id: "f1" } });
  });
});

describe("knowledgeService store policies", () => {
  it("upserts the singleton row", async () => {
    policyUpsert.mockResolvedValueOnce({ id: "default" });
    await expect(getStorePolicies()).resolves.toEqual({ id: "default" });
    expect(policyUpsert).toHaveBeenCalledWith({ where: { id: "default" }, create: { id: "default" }, update: {} });
  });

  it("ensures the row exists before updating", async () => {
    policyUpsert.mockResolvedValueOnce({ id: "default" });
    await updateStorePolicies({ shipsInternationally: true });
    expect(policyUpsert).toHaveBeenCalled();
    expect(policyUpdate).toHaveBeenCalledWith({ where: { id: "default" }, data: { shipsInternationally: true } });
  });
});

describe("knowledgeBaseService", () => {
  it("lists admin entries newest first", async () => {
    await listKnowledgeBaseForAdmin();
    expect(kbFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("feeds only active entries to the AI with a default limit", async () => {
    await listActiveKnowledgeBaseForAi();
    expect(kbFindMany.mock.calls[0][0]).toMatchObject({ where: { isActive: true }, take: 8 });
    await listActiveKnowledgeBaseForAi(3);
    expect(kbFindMany.mock.calls[1][0].take).toBe(3);
  });

  it("trims and defaults on create", async () => {
    await createKnowledgeBaseEntry({ title: " Returns ", content: " 30 days ", sourceType: "MANUAL" as never });
    expect(kbCreate).toHaveBeenCalledWith({
      data: { title: "Returns", content: "30 days", sourceType: "MANUAL", fileUrl: null, fileName: null, isActive: true },
    });
  });

  it("updates and deletes by id", async () => {
    await updateKnowledgeBaseEntry("k1", { isActive: false });
    expect(kbUpdate).toHaveBeenCalledWith({ where: { id: "k1" }, data: { isActive: false } });
    await deleteKnowledgeBaseEntry("k1");
    expect(kbDelete).toHaveBeenCalledWith({ where: { id: "k1" } });
  });
});
