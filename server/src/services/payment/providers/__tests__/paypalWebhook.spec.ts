jest.mock("axios", () => {
  const request = jest.fn() as jest.Mock & { post: jest.Mock };
  request.post = jest.fn();
  return { __esModule: true, default: request };
});
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import axios from "axios";
import { PayPalService } from "../paypal.service";

const axiosRequest = axios as unknown as jest.Mock & { post: jest.Mock };

const VALID_CERT = "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-1";
const RAW_BODY = JSON.stringify({ id: "WH-1", event_type: "PAYMENT.CAPTURE.COMPLETED" });

const orderData = {
  items: [{ productId: "p1", productName: "Widget", productCategory: "General", quantity: 2, price: 5 }],
  total: 10,
  userId: "u1",
  currency: "USD",
  internalOrderId: "order-1",
};

function httpError(status: number, data?: unknown): Error & { response?: unknown } {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  });
}

describe("PayPalService webhooks, capture and retries", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    axiosRequest.mockReset();
    axiosRequest.post.mockReset();
    axiosRequest.post.mockResolvedValue({ data: { access_token: "token-1", expires_in: 3600 } });
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    // Skip the real back-off waits between retries.
    jest
      .spyOn(PayPalService.prototype as unknown as { delay: () => Promise<void> }, "delay")
      .mockResolvedValue(undefined);
    process.env = {
      ...originalEnv,
      PAYPAL_CLIENT_ID: "client-id",
      PAYPAL_CLIENT_SECRET: "client-secret",
      PAYPAL_WEBHOOK_ID: "WH-ID-1",
      PAYPAL_MODE: "sandbox",
      PAYPAL_RETURN_URL: "http://localhost:3012/paypal/return",
      PAYPAL_CANCEL_URL: "http://localhost:3012/paypal/cancel",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("verifyWebhookSignature", () => {
    const verify = (overrides: Partial<Record<"sig" | "time" | "cert" | "id" | "body", string>> = {}) =>
      new PayPalService().verifyWebhookSignature(
        overrides.body ?? RAW_BODY,
        overrides.sig ?? "sig",
        overrides.time ?? "2026-01-01T00:00:00Z",
        overrides.cert ?? VALID_CERT,
        overrides.id ?? "tx-1"
      );

    it("returns true when PayPal reports SUCCESS and sends the expected payload", async () => {
      axiosRequest.mockResolvedValue({ data: { verification_status: "SUCCESS" } });
      await expect(verify()).resolves.toBe(true);

      const call = axiosRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.url).toBe("https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature");
      expect(call.data).toEqual({
        transmission_id: "tx-1",
        transmission_time: "2026-01-01T00:00:00Z",
        transmission_sig: "sig",
        cert_url: VALID_CERT,
        auth_algo: "SHA256withRSA",
        webhook_id: "WH-ID-1",
        webhook_event: JSON.parse(RAW_BODY),
      });
      expect(call.headers.Authorization).toBe("Bearer token-1");
    });

    it("returns false when PayPal reports FAILURE", async () => {
      axiosRequest.mockResolvedValue({ data: { verification_status: "FAILURE" } });
      await expect(verify()).resolves.toBe(false);
    });

    it("returns false without calling PayPal when PAYPAL_WEBHOOK_ID is missing", async () => {
      Reflect.deleteProperty(process.env, "PAYPAL_WEBHOOK_ID");
      await expect(verify()).resolves.toBe(false);
      expect(axiosRequest).not.toHaveBeenCalled();
    });

    it.each(["sig", "time", "cert", "id"] as const)(
      "returns false without calling PayPal when the %s header is empty",
      async (field) => {
        await expect(verify({ [field]: "" })).resolves.toBe(false);
        expect(axiosRequest).not.toHaveBeenCalled();
      }
    );

    it.each([
      "https://evil.example.com/cert",
      "https://api-m.paypal.com.evil.example/cert",
      "not a url",
    ])("rejects a cert URL outside PayPal (%s) to prevent SSRF", async (cert) => {
      await expect(verify({ cert })).resolves.toBe(false);
      expect(axiosRequest).not.toHaveBeenCalled();
    });

    it("accepts the live www.paypal.com cert host", async () => {
      axiosRequest.mockResolvedValue({ data: { verification_status: "SUCCESS" } });
      await expect(verify({ cert: "https://www.paypal.com/cert" })).resolves.toBe(true);
    });

    it("returns false for a malformed JSON body", async () => {
      await expect(verify({ body: "{not json" })).resolves.toBe(false);
      expect(axiosRequest).not.toHaveBeenCalled();
    });

    it("returns false when the verification request fails with a 4xx (no retry)", async () => {
      axiosRequest.mockRejectedValue(httpError(400));
      await expect(verify()).resolves.toBe(false);
      expect(axiosRequest).toHaveBeenCalledTimes(1);
    });

    it("returns false when the OAuth token request fails", async () => {
      axiosRequest.post.mockRejectedValue(new Error("network down"));
      await expect(verify()).resolves.toBe(false);
      expect(axiosRequest).not.toHaveBeenCalled();
    });
  });

  describe("handleWebhook", () => {
    it.each([
      ["CHECKOUT.ORDER.APPROVED", true, "order_approved"],
      ["PAYMENT.CAPTURE.COMPLETED", true, "payment_captured"],
      ["PAYMENT.CAPTURE.DENIED", false, "payment_failed"],
      ["PAYMENT.CAPTURE.FAILED", false, "payment_failed"],
      ["BILLING.SUBSCRIPTION.CREATED", true, "unknown"],
    ])("maps %s to success=%s event=%s", async (eventType, success, event) => {
      const payload = { id: "WH-1", event_type: eventType };
      const result = await new PayPalService().handleWebhook(JSON.stringify(payload), "");
      expect(result).toEqual({ success, event, data: payload });
    });

    it("returns an error for an unparseable payload", async () => {
      const result = await new PayPalService().handleWebhook("{oops", "");
      expect(result.success).toBe(false);
      expect(result.event).toBeUndefined();
      expect(typeof result.error).toBe("string");
    });
  });

  describe("capturePayment", () => {
    it("rejects an empty paymentId without calling PayPal", async () => {
      const result = await new PayPalService().capturePayment("");
      expect(result).toEqual({ success: false, error: "Valid paymentId is required" });
      expect(axiosRequest.post).not.toHaveBeenCalled();
    });

    it("returns the capture id when status is COMPLETED", async () => {
      axiosRequest.mockResolvedValue({
        data: {
          id: "PP-ORDER-1",
          status: "COMPLETED",
          purchase_units: [{ payments: { captures: [{ id: "CAP-1" }] } }],
        },
      });
      const result = await new PayPalService().capturePayment("PP-ORDER-1");
      expect(result).toMatchObject({ success: true, paymentId: "CAP-1", orderId: "PP-ORDER-1", captureId: "CAP-1" });
      expect(axiosRequest.mock.calls[0][0].url).toBe(
        "https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-1/capture"
      );
    });

    it("fails when the capture status is not COMPLETED", async () => {
      axiosRequest.mockResolvedValue({ data: { id: "PP-ORDER-1", status: "PENDING" } });
      const result = await new PayPalService().capturePayment("PP-ORDER-1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Capture status: PENDING");
    });

    it("does not treat ORDER_ALREADY_CAPTURED as success when the order is not COMPLETED", async () => {
      axiosRequest
        .mockRejectedValueOnce(httpError(422, { name: "UNPROCESSABLE_ENTITY", message: "x", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] }))
        .mockResolvedValueOnce({ data: { id: "PP-ORDER-1", status: "APPROVED" } });
      const result = await new PayPalService().capturePayment("PP-ORDER-1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("UNPROCESSABLE_ENTITY: x [ORDER_ALREADY_CAPTURED]");
    });

    it("surfaces PayPal issue codes and debug_id on other errors", async () => {
      axiosRequest.mockRejectedValue(
        httpError(422, { name: "UNPROCESSABLE_ENTITY", message: "Denied", debug_id: "dbg-1", details: [{ issue: "INSTRUMENT_DECLINED" }] })
      );
      const result = await new PayPalService().capturePayment("PP-ORDER-1");
      expect(result).toEqual({
        success: false,
        error: "UNPROCESSABLE_ENTITY: Denied [INSTRUMENT_DECLINED] (debug_id: dbg-1)",
      });
    });
  });

  describe("request retries", () => {
    it("retries 5xx responses twice and then gives up", async () => {
      axiosRequest.mockRejectedValue(httpError(503));
      const result = await new PayPalService().getOrderDetails("PP-1");
      expect(result.success).toBe(false);
      expect(axiosRequest).toHaveBeenCalledTimes(3);
    });

    it("recovers when a retry succeeds after a network error", async () => {
      axiosRequest
        .mockRejectedValueOnce(new Error("socket hang up"))
        .mockResolvedValueOnce({ data: { id: "PP-1" } });
      const result = await new PayPalService().getOrderDetails("PP-1");
      expect(result).toMatchObject({ success: true, paymentId: "PP-1" });
      expect(axiosRequest).toHaveBeenCalledTimes(2);
    });

    it("reuses a cached access token across requests", async () => {
      axiosRequest.mockResolvedValue({ data: { id: "PP-1" } });
      const service = new PayPalService();
      await service.getOrderDetails("PP-1");
      await service.getOrderDetails("PP-1");
      expect(axiosRequest.post).toHaveBeenCalledTimes(1);
      service.clearTokenCache();
      await service.getOrderDetails("PP-1");
      expect(axiosRequest.post).toHaveBeenCalledTimes(2);
    });
  });

  describe("createOrder", () => {
    it("rejects when the item total does not match the order total", async () => {
      const result = await new PayPalService().createOrder({ ...orderData, total: 12 });
      expect(result).toEqual({ success: false, error: "Item total (10) does not match order total (12)" });
      expect(axiosRequest).not.toHaveBeenCalled();
    });

    it("returns the approval URL from PayPal links", async () => {
      axiosRequest.mockResolvedValue({
        data: { id: "PP-ORDER-1", links: [{ rel: "self", href: "s" }, { rel: "approve", href: "https://paypal/approve" }] },
      });
      const result = await new PayPalService().createOrder(orderData);
      expect(result).toMatchObject({ success: true, paymentId: "PP-ORDER-1", approvalUrl: "https://paypal/approve" });
      const body = axiosRequest.mock.calls[0][0].data;
      expect(body.purchase_units[0].amount.value).toBe("10.00");
      expect(body.application_context.return_url).toBe("http://localhost:3012/paypal/return");
    });

    it("uses the live API host in live mode", async () => {
      process.env.PAYPAL_MODE = "live";
      axiosRequest.mockResolvedValue({ data: { id: "PP-1", links: [] } });
      await new PayPalService().createOrder(orderData);
      expect(axiosRequest.mock.calls[0][0].url).toBe("https://api-m.paypal.com/v2/checkout/orders");
    });
  });

  it("throws on construction when PAYPAL_CLIENT_SECRET is missing", () => {
    Reflect.deleteProperty(process.env, "PAYPAL_CLIENT_SECRET");
    expect(() => new PayPalService()).toThrow(/PAYPAL_CLIENT_SECRET/);
  });
});
