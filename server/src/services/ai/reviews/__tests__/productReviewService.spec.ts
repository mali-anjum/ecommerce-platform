const productFindFirst = jest.fn();
const productUpdate = jest.fn();
const orderFindFirst = jest.fn();
const reviewFindFirst = jest.fn();
const reviewCreate = jest.fn();
const reviewAggregate = jest.fn();
const reviewFindMany = jest.fn();

jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    product: {
      findFirst: (...a: unknown[]) => productFindFirst(...a),
      update: (...a: unknown[]) => productUpdate(...a),
    },
    order: { findFirst: (...a: unknown[]) => orderFindFirst(...a) },
    productReview: {
      findFirst: (...a: unknown[]) => reviewFindFirst(...a),
      create: (...a: unknown[]) => reviewCreate(...a),
      aggregate: (...a: unknown[]) => reviewAggregate(...a),
      findMany: (...a: unknown[]) => reviewFindMany(...a),
    },
  },
}));

import { createProductReview, listProductReviews } from "../ProductReviewService";

const input = { userId: "u1", productId: "p1", rating: 2, body: "  Battery died after a day  " };

beforeEach(() => {
  jest.clearAllMocks();
  productFindFirst.mockResolvedValue({ id: "p1" });
  reviewFindFirst.mockResolvedValue(null);
  reviewCreate.mockImplementation(async ({ data }) => ({ id: "r1", ...data, createdAt: new Date("2026-02-01T00:00:00Z") }));
  reviewAggregate.mockResolvedValue({ _avg: { rating: 3.666 }, _count: { _all: 3 } });
});

describe("createProductReview", () => {
  it("rejects unknown, inactive or archived products", async () => {
    productFindFirst.mockResolvedValueOnce(null);
    await expect(createProductReview(input)).rejects.toMatchObject({ statusCode: 404 });
    expect(productFindFirst.mock.calls[0][0].where).toEqual({ id: "p1", isActive: true, isArchived: false });
  });

  it("allows only one review per customer per product", async () => {
    reviewFindFirst.mockResolvedValueOnce({ id: "r0" });
    await expect(createProductReview(input)).rejects.toMatchObject({
      statusCode: 409,
      message: "You have already reviewed this product",
    });
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("requires a delivered order owned by the reviewer when orderId is given", async () => {
    orderFindFirst.mockResolvedValueOnce(null);
    await expect(createProductReview({ ...input, orderId: "o1" })).rejects.toMatchObject({ statusCode: 400 });
    expect(orderFindFirst.mock.calls[0][0].where).toEqual({ id: "o1", userId: "u1", status: "DELIVERED" });
  });

  it("rejects an order that did not contain the product", async () => {
    orderFindFirst.mockResolvedValueOnce({ items: [{ productId: "other" }] });
    await expect(createProductReview({ ...input, orderId: "o1" })).rejects.toMatchObject({
      message: "This product was not part of the selected order",
    });
  });

  it("stores a classified, trimmed review and refreshes the rounded product rating", async () => {
    const result = await createProductReview(input);
    expect(reviewCreate.mock.calls[0][0].data).toMatchObject({
      productId: "p1",
      userId: "u1",
      rating: 2,
      body: "Battery died after a day",
      sentiment: "negative",
      status: "APPROVED",
    });
    expect(reviewCreate.mock.calls[0][0].data.themes).toContain("battery_life");
    expect(productUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { rating: 3.7 } });
    expect(result.reviewCount).toBe(3);
    expect(result.review.createdAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("accepts a verified purchase", async () => {
    orderFindFirst.mockResolvedValueOnce({ items: [{ productId: "p1" }] });
    await createProductReview({ ...input, orderId: "o1" });
    expect(reviewCreate.mock.calls[0][0].data.orderId).toBe("o1");
  });

  it("skips the rating update when there is no average", async () => {
    reviewAggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { _all: 0 } });
    await createProductReview(input);
    expect(productUpdate).not.toHaveBeenCalled();
  });
});

describe("listProductReviews", () => {
  it("returns approved reviews newest first with a safe author name", async () => {
    reviewFindMany.mockResolvedValueOnce([
      { id: "r1", rating: 5, body: "Great", themes: [], sentiment: "positive", createdAt: new Date("2026-01-01T00:00:00Z"), user: null },
    ]);
    const reviews = await listProductReviews("p1");
    expect(reviewFindMany.mock.calls[0][0]).toMatchObject({
      where: { productId: "p1", status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    expect(reviews[0]).toEqual({
      id: "r1",
      rating: 5,
      body: "Great",
      themes: [],
      sentiment: "positive",
      authorName: "Customer",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
