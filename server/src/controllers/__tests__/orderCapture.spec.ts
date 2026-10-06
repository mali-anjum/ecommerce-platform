import type { NextFunction, Response } from "express";

const orderFindFirst = jest.fn();
const orderFindUniqueOrThrow = jest.fn();
const orderUpdate = jest.fn();
const paymentUpdate = jest.fn();
const couponUpdate = jest.fn();
const capturePaymentMock = jest.fn();
const claimOrderForFulfillment = jest.fn();
const applyPurchaseFulfillment = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    order: {
      findFirst: (...a: unknown[]) => orderFindFirst(...a),
      findUniqueOrThrow: (...a: unknown[]) => orderFindUniqueOrThrow(...a),
      update: (...a: unknown[]) => orderUpdate(...a),
    },
    payment: { update: (...a: unknown[]) => paymentUpdate(...a) },
    coupon: { update: (...a: unknown[]) => couponUpdate(...a) },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/payment/payment.factory", () => ({
  PaymentFactory: {
    createPaymentService: () => ({ capturePayment: (...a: unknown[]) => capturePaymentMock(...a) }),
  },
}));
jest.mock("../../services/order", () => ({
  ...jest.requireActual("../../services/order/paymentDto"),
  buildFulfillmentAnalyticsContext: (order: { id: string }) => ({ orderId: order.id }),
  parsePurchasedCartItemIds: () => undefined,
  claimOrderForFulfillment: (...a: unknown[]) => claimOrderForFulfillment(...a),
  applyPurchaseFulfillment: (...a: unknown[]) => applyPurchaseFulfillment(...a),
}));

import { capturePayment } from "../orderController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const pendingOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "order-1",
  userId: "user-1",
  status: "PAYMENT_APPROVED",
  paymentStatus: "APPROVED",
  total: 80,
  couponId: "coupon-1",
  items: [{ productId: "p1", quantity: 1 }],
  payments: [{ id: "pay-1", providerReferenceId: "PP-1", providerCaptureId: null, metadata: null }],
  ...overrides,
});

async function run(body: Record<string, unknown>, user: unknown = { userId: "user-1", email: "a@b.co" }) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  capturePayment({ body, user } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

const validBody = { paymentId: "PP-1", paymentMethod: "paypal", internalOrderId: "order-1" };

beforeEach(() => {
  jest.clearAllMocks();
  orderFindUniqueOrThrow.mockResolvedValue({ ...pendingOrder(), status: "PROCESSING", payments: [] });
});

describe("capturePayment", () => {
  it("returns 400 when fields are missing", async () => {
    const { next } = await run({ paymentId: "PP-1" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("returns 400 for an unsupported method", async () => {
    const { next } = await run({ ...validBody, paymentMethod: "bitcoin" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("scopes the lookup to the authenticated user (404 for others' orders)", async () => {
    orderFindFirst.mockResolvedValueOnce(null);
    const { next } = await run(validBody);
    expect(orderFindFirst.mock.calls[0][0].where).toEqual({ id: "order-1", userId: "user-1" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
    expect(capturePaymentMock).not.toHaveBeenCalled();
  });

  it("is idempotent when the order is already paid", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder({ status: "PROCESSING", paymentStatus: "COMPLETED" }));
    const { res } = await run(validBody);
    expect(capturePaymentMock).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].message).toBe("Payment already captured for this order");
  });

  it("returns 409 for non-capturable states", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder({ status: "CANCELLED", paymentStatus: "CANCELLED" }));
    const { next } = await run(validBody);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 409 });
  });

  it("returns 404 when the payment reference does not belong to the order", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder());
    const { next } = await run({ ...validBody, paymentId: "PP-OTHER" });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 404 });
    expect(capturePaymentMock).not.toHaveBeenCalled();
  });

  it("marks the order CAPTURE_FAILED when the provider declines", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder());
    capturePaymentMock.mockResolvedValueOnce({ success: false, error: "INSTRUMENT_DECLINED" });
    const { next } = await run(validBody);
    expect(paymentUpdate).toHaveBeenCalledWith({ where: { id: "pay-1" }, data: { attemptStatus: "FAILED" } });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "CAPTURE_FAILED", paymentStatus: "FAILED" },
    });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(claimOrderForFulfillment).not.toHaveBeenCalled();
  });

  it("captures, claims, fulfils and counts the coupon exactly once", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder());
    capturePaymentMock.mockResolvedValueOnce({ success: true, captureId: "CAP-1", data: { id: "CAP-1" } });
    claimOrderForFulfillment.mockResolvedValueOnce(true);
    const { res } = await run(validBody);

    expect(paymentUpdate.mock.calls[0][0].data).toMatchObject({ attemptStatus: "COMPLETED", providerCaptureId: "CAP-1" });
    expect(claimOrderForFulfillment).toHaveBeenCalledWith("order-1");
    expect(applyPurchaseFulfillment).toHaveBeenCalledWith("user-1", [{ productId: "p1", quantity: 1 }], undefined, { orderId: "order-1" });
    expect(couponUpdate).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].message).toBe("Payment captured and order completed successfully");
  });

  it("skips fulfillment when a webhook already claimed the order (race)", async () => {
    orderFindFirst.mockResolvedValueOnce(pendingOrder());
    capturePaymentMock.mockResolvedValueOnce({ success: true, captureId: "CAP-1", data: {} });
    claimOrderForFulfillment.mockResolvedValueOnce(false);
    const { res } = await run(validBody);

    expect(applyPurchaseFulfillment).not.toHaveBeenCalled();
    expect(couponUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].message).toBe("Payment already captured for this order");
  });
});
