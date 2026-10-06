import { Prisma } from "@prisma/client";
import type { NextFunction, Response } from "express";

const reviews = { createProductReview: jest.fn(), listProductReviews: jest.fn() };
const kb = {
  listKnowledgeBaseForAdmin: jest.fn(),
  createKnowledgeBaseEntry: jest.fn(),
  updateKnowledgeBaseEntry: jest.fn(),
  deleteKnowledgeBaseEntry: jest.fn(),
};
const extractDocumentText = jest.fn();
const persistDocumentFile = jest.fn();

jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/ai/reviews", () => reviews);
jest.mock("../../services/knowledge/knowledgeBaseService", () => kb);
jest.mock("../../services/knowledge/pdfTextExtractor", () => ({
  extractDocumentText: (...a: unknown[]) => extractDocumentText(...a),
}));
jest.mock("../../services/knowledge/documentStorage", () => ({
  persistDocumentFile: (...a: unknown[]) => persistDocumentFile(...a),
}));

import { getProductReviews, postProductReview } from "../productReviewController";
import {
  createManualKnowledgeBase,
  deleteAdminKnowledgeBase,
  getAdminKnowledgeBase,
  updateAdminKnowledgeBase,
  uploadKnowledgeBaseDocument,
} from "../knowledgeBaseController";
import { NotFoundError } from "../../utils/ApiError";

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

beforeEach(() => jest.clearAllMocks());

describe("productReviewController", () => {
  const validatedData = { productId: "p1", rating: 4, body: "Nice" };

  it.each([
    [undefined],
    [{ userId: "u1", email: "a@b.co", role: "SELLER" }],
    [{ userId: "u1", email: "a@b.co", role: "SUPER_ADMIN" }],
  ])("only lets customers review (%o)", async (user) => {
    const { next } = await run(postProductReview, { user, validatedData });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    expect(reviews.createProductReview).not.toHaveBeenCalled();
  });

  it("creates a review for the authenticated customer", async () => {
    reviews.createProductReview.mockResolvedValueOnce({ review: { id: "r1" }, reviewCount: 1 });
    const { res } = await run(postProductReview, {
      user: { userId: "u1", email: "a@b.co", role: "USER" },
      validatedData: { ...validatedData, userId: "spoofed" },
    });
    expect(reviews.createProductReview).toHaveBeenCalledWith({
      userId: "u1",
      productId: "p1",
      orderId: undefined,
      rating: 4,
      body: "Nice",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("lists reviews for a product", async () => {
    reviews.listProductReviews.mockResolvedValueOnce([]);
    const { res } = await run(getProductReviews, { params: { productId: "p1" } });
    expect(reviews.listProductReviews).toHaveBeenCalledWith("p1");
    expect(res.json.mock.calls[0][0].data).toEqual({ reviews: [] });
  });
});

describe("knowledgeBaseController", () => {
  const pdf = { originalname: "Returns Policy.pdf", mimetype: "application/pdf", buffer: Buffer.from("x") };

  it("lists documents", async () => {
    kb.listKnowledgeBaseForAdmin.mockResolvedValueOnce([{ id: "k1" }]);
    const { res } = await run(getAdminKnowledgeBase, {});
    expect(res.json.mock.calls[0][0].data).toEqual({ documents: [{ id: "k1" }] });
  });

  it("requires a file", async () => {
    const { next } = await run(uploadKnowledgeBaseDocument, {});
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Document file is required" });
  });

  it("returns 400 when text extraction fails", async () => {
    extractDocumentText.mockRejectedValueOnce(new Error("corrupt"));
    const { next } = await run(uploadKnowledgeBaseDocument, { file: pdf });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Failed to extract text from document" });
  });

  it("rejects documents with too little text", async () => {
    extractDocumentText.mockResolvedValueOnce("tiny");
    const { next } = await run(uploadKnowledgeBaseDocument, { file: pdf });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(kb.createKnowledgeBaseEntry).not.toHaveBeenCalled();
  });

  it("stores the extracted text, defaulting the title to the file name", async () => {
    extractDocumentText.mockResolvedValueOnce("Returns are accepted within 30 days.");
    persistDocumentFile.mockResolvedValueOnce("https://cdn/doc.pdf");
    kb.createKnowledgeBaseEntry.mockResolvedValueOnce({ id: "k1" });
    const { res } = await run(uploadKnowledgeBaseDocument, { file: pdf, body: { isActive: "false" } });
    expect(kb.createKnowledgeBaseEntry).toHaveBeenCalledWith({
      title: "Returns Policy",
      content: "Returns are accepted within 30 days.",
      sourceType: "PDF",
      fileUrl: "https://cdn/doc.pdf",
      fileName: "Returns Policy.pdf",
      isActive: false,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("creates manual entries", async () => {
    kb.createKnowledgeBaseEntry.mockResolvedValueOnce({ id: "k2" });
    await run(createManualKnowledgeBase, { validatedData: { title: "T", content: "C" } });
    expect(kb.createKnowledgeBaseEntry).toHaveBeenCalledWith({ title: "T", content: "C", sourceType: "MANUAL", isActive: true });
  });

  it.each([
    ["update", updateAdminKnowledgeBase, kb.updateKnowledgeBaseEntry],
    ["delete", deleteAdminKnowledgeBase, kb.deleteKnowledgeBaseEntry],
  ])("%s maps only missing rows to 404", async (_name, handler, service) => {
    service.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("x", { code: "P2025", clientVersion: "t" }));
    const missing = await run(handler, { params: { id: "k9" }, validatedData: {} });
    expect(missing.next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);

    service.mockRejectedValueOnce(new Error("db down"));
    const broken = await run(handler, { params: { id: "k1" }, validatedData: {} });
    expect(broken.next.mock.calls[0][0].message).toBe("db down");
  });
});
