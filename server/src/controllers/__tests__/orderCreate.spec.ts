import type { NextFunction, Response } from "express";

const addressFindFirst = jest.fn();
const couponFindUnique = jest.fn();
const orderCreate = jest.fn();
const orderUpdate = jest.fn();
const paymentCreate = jest.fn();
const validateCheckoutSelection = jest.fn();
const createOrderMock = jest.fn();
const getAvailablePaymentMethods = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    address: { findFirst: (...a: unknown[]) => addressFindFirst(...a) },
    coupon: { findUnique: (...a: unknown[]) => couponFindUnique(...a) },
    order: {
      create: (...a: unknown[]) => orderCreate(...a),
      update: (...a: unknown[]) => orderUpdate(...a),
    },
    payment: { create: (...a: unknown[]) => paymentCreate(...a) },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/cart/validateCheckoutSelection", () => ({
  validateCheckoutSelection: (...a: unknown[]) => validateCheckoutSelection(...a),
}));
jest.mock("../../services/payment/payment.factory", () => ({
  PaymentFactory: { createPaymentService: () => ({ createOrder: (...a: unknown[]) => createOrderMock(...a) }) },
}));
jest.mock("../../services/payment/paymentMethod", () => ({
  ...jest.requireActual("../../services/payment/paymentMethod"),
  getAvailablePaymentMethods: () => getAvailablePaymentMethods(),
}));
jest.mock("../../services/order", () => ({
  ...jest.requireActual("../../services/order/paymentDto"),
  resolveSellerIdsForProductIds: async () => new Map([["p1", "seller-1"]]),
}));

import { createPaymentOrder } from "../orderController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

async function run(body: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  createPaymentOrder({ body, user: { userId: "user-1", email: "a@b.co" } } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

const body = { cartItemIds: ["ci-1"], paymentMethod: "stripe", addressId: "addr-1", total: 0.01, price: 0.01 };
const validatedLine = {
  cartItemId: "ci-1",
  productId: "p1",
  productName: "Lamp",
  productCategory: "Lighting",
  quantity: 2,
  size: "",
  color: "Default",
  price: 40,
};
const validCoupon = {
  id: "coupon-1",
  isActive: true,
  discountPercent: 10,
  startDate: new Date(Date.now() - 1000),
  endDate: new Date(Date.now() + 86_400_000),
  usageLimit: 5,
  usageCount: 0,
  minOrderValue: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  getAvailablePaymentMethods.mockReturnValue(["STRIPE", "PAYPAL"]);
  addressFindFirst.mockResolvedValue({ id: "addr-1" });
  validateCheckoutSelection.mockResolvedValue([validatedLine]);
  orderCreate.mockResolvedValue({ id: "order-1" });
  createOrderMock.mockResolvedValue({ success: true, paymentId: "cs_1", url: "https://checkout.stripe.test/cs_1" });
});

describe("createPaymentOrder", () => {
  it("requires a shipping address", async () => {
    const { next } = await run({ ...body, addressId: undefined });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Shipping address is required" });
  });

  it("rejects unsupported payment methods", async () => {
    const { next } = await run({ ...body, paymentMethod: "cash" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("returns 503 for a disabled or unconfigured provider", async () => {
    getAvailablePaymentMethods.mockReturnValue(["PAYPAL"]);
    const { next } = await run(body);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 503 });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when the address belongs to someone else", async () => {
    addressFindFirst.mockResolvedValueOnce(null);
    const { next } = await run(body);
    expect(addressFindFirst).toHaveBeenCalledWith({ where: { id: "addr-1", userId: "user-1" }, select: { id: true } });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404, message: "Shipping address not found" });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("computes the total from DB prices and ignores client-sent amounts", async () => {
    const { res } = await run(body);
    // 2 x 40 = 80 subtotal, no volume discount, 9.99 shipping, 8.89% tax on 80.
    const expectedTotal = 80 + 9.99 + 80 * 0.0889;
    expect(orderCreate.mock.calls[0][0].data.total).toBeCloseTo(expectedTotal, 6);
    expect(createOrderMock.mock.calls[0][0].total).toBeCloseTo(expectedTotal, 6);
    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({
      orderId: "order-1",
      attemptStatus: "PENDING",
      providerReferenceId: "cs_1",
      metadata: { cartItemIds: ["ci-1"] },
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("stamps each line with its seller", async () => {
    await run(body);
    expect(orderCreate.mock.calls[0][0].data.items.create[0]).toMatchObject({ productId: "p1", sellerId: "seller-1", price: 40 });
  });

  it("applies a valid coupon to the server-side total", async () => {
    couponFindUnique.mockResolvedValueOnce(validCoupon);
    await run({ ...body, couponId: "coupon-1" });
    const expected = 72 + 9.99 + 72 * 0.0889;
    expect(orderCreate.mock.calls[0][0].data.total).toBeCloseTo(expected, 6);
    expect(orderCreate.mock.calls[0][0].data.couponId).toBe("coupon-1");
  });

  it.each([
    [null, "Coupon is invalid or expired"],
    [{ ...validCoupon, endDate: new Date(Date.now() - 1000) }, "Coupon has expired"],
    [{ ...validCoupon, usageCount: 5 }, "Coupon has reached its usage limit"],
    [{ ...validCoupon, minOrderValue: 100 }, "Order must be at least 100.00 to use this coupon"],
  ])("rejects unusable coupons (%#)", async (coupon, message) => {
    couponFindUnique.mockResolvedValueOnce(coupon);
    const { next } = await run({ ...body, couponId: "coupon-1" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message });
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("marks the draft order failed when the provider rejects it", async () => {
    createOrderMock.mockResolvedValueOnce({ success: false, error: "Stripe down" });
    const { next } = await run(body);
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" },
    });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Stripe down" });
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("propagates checkout selection errors", async () => {
    validateCheckoutSelection.mockRejectedValueOnce(Object.assign(new Error("Insufficient stock"), { statusCode: 400 }));
    const { next } = await run(body);
    expect(next.mock.calls[0][0]).toMatchObject({ message: "Insufficient stock" });
    expect(orderCreate).not.toHaveBeenCalled();
  });
});
