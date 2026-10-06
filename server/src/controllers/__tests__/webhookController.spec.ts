import type { Request, Response } from "express";

const paymentFindFirst = jest.fn();
const paymentFindMany = jest.fn();
const paymentUpdate = jest.fn();
const paymentUpdateMany = jest.fn();
const orderUpdate = jest.fn();
const orderUpdateMany = jest.fn();
const couponUpdate = jest.fn();
const verifyWebhookSignature = jest.fn();
const handleWebhook = jest.fn();
const createPaymentService = jest.fn();
const applyPurchaseFulfillment = jest.fn();
const claimOrderForFulfillment = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    payment: {
      findFirst: (...a: unknown[]) => paymentFindFirst(...a),
      findMany: (...a: unknown[]) => paymentFindMany(...a),
      update: (...a: unknown[]) => paymentUpdate(...a),
      updateMany: (...a: unknown[]) => paymentUpdateMany(...a),
    },
    order: {
      update: (...a: unknown[]) => orderUpdate(...a),
      updateMany: (...a: unknown[]) => orderUpdateMany(...a),
    },
    coupon: { update: (...a: unknown[]) => couponUpdate(...a) },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../services/payment/payment.factory", () => ({
  PaymentFactory: { createPaymentService: (...a: unknown[]) => createPaymentService(...a) },
}));
jest.mock("../../services/order", () => ({
  FULFILLED_ORDER_STATUSES: ["PROCESSING", "SHIPPED", "DELIVERED"],
  applyPurchaseFulfillment: (...a: unknown[]) => applyPurchaseFulfillment(...a),
  claimOrderForFulfillment: (...a: unknown[]) => claimOrderForFulfillment(...a),
  buildFulfillmentAnalyticsContext: (order: { id: string }) => ({ orderId: order.id }),
  parsePurchasedCartItemIds: () => ["cart-item-1"],
}));

import { genericWebhook, getRawBody, paypalWebhook, stripeWebhook } from "../webhook.controller";

type FakeRes = Response & { status: jest.Mock; send: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

const PAYPAL_HEADERS = {
  "paypal-transmission-sig": "sig",
  "paypal-transmission-id": "tid",
  "paypal-transmission-time": "2026-10-06T00:00:00Z",
  "paypal-cert-url": "https://api-m.paypal.com/cert.pem",
};

function buildReq(parts: Partial<Request> & { rawBody?: Buffer }): Request {
  return { headers: {}, params: {}, body: {}, ...parts } as unknown as Request;
}

const paymentWithOrder = (status = "PENDING_PAYMENT", couponId: string | null = "coupon-1") => ({
  id: "pay-1",
  metadata: { cartItemIds: ["cart-item-1"] },
  order: {
    id: "order-1",
    userId: "user-1",
    total: 50,
    status,
    couponId,
    items: [{ productId: "p1", quantity: 2 }],
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  createPaymentService.mockReturnValue({ verifyWebhookSignature, handleWebhook });
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("getRawBody", () => {
  it("prefers the captured raw bytes", () => {
    const raw = Buffer.from('{\n  "id": "evt_1"\n}');
    expect(getRawBody(buildReq({ rawBody: raw, body: { id: "evt_1" } }))).toBe('{\n  "id": "evt_1"\n}');
  });

  it("accepts a Buffer body from express.raw", () => {
    expect(getRawBody(buildReq({ body: Buffer.from("abc") }))).toBe("abc");
  });

  it("falls back to string and JSON bodies", () => {
    expect(getRawBody(buildReq({ body: "plain" }))).toBe("plain");
    expect(getRawBody(buildReq({ body: { a: 1 } }))).toBe('{"a":1}');
    expect(getRawBody(buildReq({ body: undefined }))).toBe("{}");
  });
});

describe("stripeWebhook", () => {
  it("passes the exact raw body and signature header to the provider", async () => {
    handleWebhook.mockResolvedValueOnce({ success: true, event: "unknown" });
    const raw = Buffer.from('{\n  "type": "ping"\n}');
    const res = buildRes();
    await stripeWebhook(buildReq({ rawBody: raw, headers: { "stripe-signature": "t=1,v1=abc" } }), res);
    expect(handleWebhook).toHaveBeenCalledWith('{\n  "type": "ping"\n}', "t=1,v1=abc");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an invalid signature with 400 and does no work", async () => {
    handleWebhook.mockResolvedValueOnce({ success: false, error: "No signatures found" });
    const res = buildRes();
    await stripeWebhook(buildReq({ headers: { "stripe-signature": "bad" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(paymentFindFirst).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });

  it("completes payment and fulfils the order once on checkout success", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: true,
      event: "payment_success",
      data: { id: "cs_1", payment_status: "paid", metadata: {} },
    });
    paymentFindFirst.mockResolvedValueOnce(paymentWithOrder());
    claimOrderForFulfillment.mockResolvedValueOnce(true);
    const res = buildRes();
    await stripeWebhook(buildReq({}), res);

    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: expect.objectContaining({ attemptStatus: "COMPLETED", providerCaptureId: "cs_1" }),
    });
    expect(claimOrderForFulfillment).toHaveBeenCalledWith("order-1");
    expect(applyPurchaseFulfillment).toHaveBeenCalledWith(
      "user-1",
      [{ productId: "p1", quantity: 2 }],
      ["cart-item-1"],
      { orderId: "order-1" },
    );
    expect(couponUpdate).toHaveBeenCalledWith({
      where: { id: "coupon-1" },
      data: { usageCount: { increment: 1 } },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("is a no-op for fulfillment on duplicate delivery (claim already taken)", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: true,
      event: "payment_success",
      data: { id: "cs_1", payment_status: "paid" },
    });
    paymentFindFirst.mockResolvedValueOnce(paymentWithOrder("PROCESSING"));
    claimOrderForFulfillment.mockResolvedValueOnce(false);
    const res = buildRes();
    await stripeWebhook(buildReq({}), res);

    expect(applyPurchaseFulfillment).not.toHaveBeenCalled();
    expect(couponUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("ignores completed sessions that are not yet paid (async payment methods)", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: true,
      event: "payment_success",
      data: { id: "cs_1", payment_status: "unpaid" },
    });
    const res = buildRes();
    await stripeWebhook(buildReq({}), res);
    expect(paymentFindFirst).not.toHaveBeenCalled();
    expect(claimOrderForFulfillment).not.toHaveBeenCalled();
  });

  it("falls back to the internal order id from metadata", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: true,
      event: "payment_success",
      data: { id: "cs_2", metadata: { internalOrderId: "order-1" } },
    });
    paymentFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(paymentWithOrder());
    claimOrderForFulfillment.mockResolvedValueOnce(true);
    await stripeWebhook(buildReq({}), buildRes());
    expect(paymentFindFirst.mock.calls[1][0].where).toEqual({ orderId: "order-1" });
    expect(applyPurchaseFulfillment).toHaveBeenCalled();
  });

  it("skips orders without items", async () => {
    handleWebhook.mockResolvedValueOnce({ success: true, event: "payment_success", data: { id: "cs_3" } });
    paymentFindFirst.mockResolvedValueOnce({ ...paymentWithOrder(), order: { ...paymentWithOrder().order, items: [] } });
    await stripeWebhook(buildReq({}), buildRes());
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("marks a pending order failed on payment_failed", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: false,
      event: "payment_failed",
      data: { id: "pi_1", metadata: { internalOrderId: "order-1" } },
    });
    orderUpdateMany.mockResolvedValueOnce({ count: 1 });
    const res = buildRes();
    await stripeWebhook(buildReq({}), res);

    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        status: { notIn: ["PROCESSING", "SHIPPED", "DELIVERED"] },
        paymentStatus: { notIn: ["COMPLETED", "REFUNDED"] },
      },
      data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" },
    });
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { orderId: "order-1", attemptStatus: { in: ["PENDING", "AUTHORIZED"] } },
      data: { attemptStatus: "FAILED" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("never downgrades an already-paid order on a late failure event", async () => {
    handleWebhook.mockResolvedValueOnce({
      success: false,
      event: "payment_failed",
      data: { id: "pi_1", metadata: { internalOrderId: "order-1" } },
    });
    orderUpdateMany.mockResolvedValueOnce({ count: 0 });
    await stripeWebhook(buildReq({}), buildRes());
    expect(paymentUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 500 when processing throws", async () => {
    handleWebhook.mockRejectedValueOnce(new Error("boom"));
    const res = buildRes();
    await stripeWebhook(buildReq({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Internal server error");
  });
});

describe("paypalWebhook", () => {
  const captureEvent = {
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: { id: "CAP-1", supplementary_data: { related_ids: { order_id: "PP-ORDER-1" } } },
  };

  it("rejects requests whose signature fails verification", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(false);
    const res = buildRes();
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS, body: captureEvent }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it("verifies with every transmission header in order", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(false);
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS, body: captureEvent }), buildRes());
    expect(verifyWebhookSignature).toHaveBeenCalledWith(
      JSON.stringify(captureEvent),
      "sig",
      "2026-10-06T00:00:00Z",
      "https://api-m.paypal.com/cert.pem",
      "tid",
    );
  });

  it("reads the capture from the nested resource and fulfils the order", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(true);
    handleWebhook.mockResolvedValueOnce({ success: true, event: "payment_captured", data: captureEvent });
    paymentFindFirst.mockResolvedValueOnce(paymentWithOrder("PAYMENT_APPROVED", null));
    claimOrderForFulfillment.mockResolvedValueOnce(true);
    const res = buildRes();
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS, body: captureEvent }), res);

    expect(paymentFindFirst.mock.calls[0][0].where).toEqual({ providerReferenceId: "PP-ORDER-1" });
    expect(paymentUpdate.mock.calls[0][0].data.providerCaptureId).toBe("CAP-1");
    expect(applyPurchaseFulfillment).toHaveBeenCalledTimes(1);
    expect(couponUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("marks PENDING_PAYMENT orders approved on CHECKOUT.ORDER.APPROVED", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(true);
    handleWebhook.mockResolvedValueOnce({
      success: true,
      event: "order_approved",
      data: { event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "PP-ORDER-1" } },
    });
    paymentFindMany.mockResolvedValueOnce([{ id: "pay-1", orderId: "order-1" }]);
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS }), buildRes());

    expect(paymentFindMany.mock.calls[0][0].where).toEqual({
      providerReferenceId: "PP-ORDER-1",
      order: { status: "PENDING_PAYMENT" },
    });
    expect(orderUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: "order-1" },
      data: { status: "PAYMENT_APPROVED", paymentStatus: "APPROVED" },
    });
    expect(paymentUpdate).toHaveBeenCalledWith({ where: { id: "pay-1" }, data: { attemptStatus: "AUTHORIZED" } });
  });

  it("resolves the order via the payment reference on capture failure", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(true);
    handleWebhook.mockResolvedValueOnce({ success: false, event: "payment_failed", data: captureEvent });
    paymentFindFirst.mockResolvedValueOnce({ orderId: "order-9" });
    orderUpdateMany.mockResolvedValueOnce({ count: 1 });
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS }), buildRes());
    expect(orderUpdateMany.mock.calls[0][0].where.id).toBe("order-9");
  });

  it("ignores failure events for unknown payments", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(true);
    handleWebhook.mockResolvedValueOnce({ success: false, event: "payment_failed", data: captureEvent });
    paymentFindFirst.mockResolvedValueOnce(null);
    await paypalWebhook(buildReq({ headers: PAYPAL_HEADERS }), buildRes());
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });
});

describe("genericWebhook", () => {
  it("always verifies PayPal signatures, even when transmission headers are missing", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(false);
    const res = buildRes();
    await genericWebhook(
      buildReq({
        params: { provider: "paypal" },
        body: { event_type: "PAYMENT.CAPTURE.COMPLETED" },
      }),
      res,
    );
    expect(verifyWebhookSignature).toHaveBeenCalledWith(expect.any(String), "", "", "", "");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it("does not let a crafted path like 'xpaypal' bypass verification", async () => {
    const res = buildRes();
    await genericWebhook(buildReq({ params: { provider: "xpaypal" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Unsupported payment provider");
    expect(handleWebhook).not.toHaveBeenCalled();
  });

  it("routes stripe to the signature-checked Stripe flow", async () => {
    handleWebhook.mockResolvedValueOnce({ success: false, error: "bad sig" });
    const res = buildRes();
    await genericWebhook(buildReq({ params: { provider: "stripe" } }), res);
    expect(createPaymentService).toHaveBeenCalledWith("STRIPE");
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("uses the x-payment-provider header when no path param is given", async () => {
    verifyWebhookSignature.mockResolvedValueOnce(false);
    const res = buildRes();
    await genericWebhook(buildReq({ headers: { "x-payment-provider": "PAYPAL" } }), res);
    expect(verifyWebhookSignature).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when no provider is given", async () => {
    const res = buildRes();
    await genericWebhook(buildReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
