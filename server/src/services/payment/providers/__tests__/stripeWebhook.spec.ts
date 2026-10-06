const sessionsCreateMock = jest.fn();
const sessionsRetrieveMock = jest.fn();
const constructEventMock = jest.fn();

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => sessionsCreateMock(...args),
        retrieve: (...args: unknown[]) => sessionsRetrieveMock(...args),
      },
    },
    webhooks: {
      constructEvent: (...args: unknown[]) => constructEventMock(...args),
    },
  }))
);
jest.mock("../../../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { StripeService } from "../stripe.service";

const orderData = {
  items: [
    { productId: "p1", productName: "Widget", productCategory: "General", quantity: 1, price: 10 },
  ],
  total: 10,
  userId: "user-1",
  currency: "USD",
  internalOrderId: "order-1",
};

describe("StripeService webhooks and capture", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset only per-call mocks; the Stripe constructor keeps its implementation.
    for (const mock of [sessionsCreateMock, sessionsRetrieveMock, constructEventMock]) mock.mockReset();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_mock",
      STRIPE_WEBHOOK_SECRET: "whsec_mock",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("handleWebhook", () => {
    const eventOf = (type: string) => ({ type, data: { object: { id: "obj_1" } } });

    it.each([
      ["checkout.session.completed", true, "payment_success"],
      ["checkout.session.async_payment_succeeded", true, "payment_success"],
      ["checkout.session.expired", false, "payment_failed"],
      ["checkout.session.async_payment_failed", false, "payment_failed"],
      ["payment_intent.payment_failed", false, "payment_failed"],
    ])("maps %s to success=%s event=%s", async (type, success, event) => {
      constructEventMock.mockReturnValue(eventOf(type));
      const result = await new StripeService().handleWebhook("{}", "sig");
      expect(result).toEqual({ success, event, data: { id: "obj_1" } });
    });

    it("acknowledges unknown events without returning their payload", async () => {
      constructEventMock.mockReturnValue(eventOf("customer.created"));
      const result = await new StripeService().handleWebhook("{}", "sig");
      expect(result).toEqual({ success: true, event: "unknown" });
    });

    it("verifies the raw body (Buffer decoded as utf8) with the webhook secret", async () => {
      constructEventMock.mockReturnValue(eventOf("customer.created"));
      await new StripeService().handleWebhook(Buffer.from('{"a":1}'), "sig_header");
      expect(constructEventMock).toHaveBeenCalledWith('{"a":1}', "sig_header", "whsec_mock");
    });

    it("returns an error when the signature check throws", async () => {
      constructEventMock.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature");
      });
      const result = await new StripeService().handleWebhook("{}", "bad");
      expect(result.success).toBe(false);
      expect(result.event).toBeUndefined();
      expect(result.error).toMatch(/signature/i);
    });

    it("rejects when STRIPE_WEBHOOK_SECRET is missing and never parses the event", async () => {
      Reflect.deleteProperty(process.env, "STRIPE_WEBHOOK_SECRET");
      const result = await new StripeService().handleWebhook("{}", "sig");
      expect(result).toEqual({ success: false, error: "STRIPE_WEBHOOK_SECRET is not configured" });
      expect(constructEventMock).not.toHaveBeenCalled();
    });

    it("returns an error when STRIPE_SECRET_KEY is missing", async () => {
      Reflect.deleteProperty(process.env, "STRIPE_SECRET_KEY");
      const result = await new StripeService().handleWebhook("{}", "sig");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/STRIPE_SECRET_KEY/);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("is true only when a webhook secret is configured", async () => {
      expect(await new StripeService().verifyWebhookSignature("", "", "")).toBe(true);
      process.env.STRIPE_WEBHOOK_SECRET = "   ";
      expect(await new StripeService().verifyWebhookSignature("", "", "")).toBe(false);
    });
  });

  describe("createOrder", () => {
    it("copies the order id onto the PaymentIntent metadata", async () => {
      sessionsCreateMock.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.com/x" });
      const result = await new StripeService().createOrder(orderData);

      expect(result).toMatchObject({ success: true, paymentId: "cs_1", url: "https://checkout.stripe.com/x" });
      const params = sessionsCreateMock.mock.calls[0][0];
      expect(params.client_reference_id).toBe("order-1");
      expect(params.payment_intent_data.metadata).toEqual({ userId: "user-1", internalOrderId: "order-1" });
      expect(params.line_items).toHaveLength(1);
      expect(params.line_items[0].price_data.unit_amount).toBe(1000);
    });

    it("fails when Stripe returns no checkout URL", async () => {
      sessionsCreateMock.mockResolvedValue({ id: "cs_1", url: null });
      const result = await new StripeService().createOrder(orderData);
      expect(result).toEqual({ success: false, error: "Stripe did not return a checkout URL" });
    });

    it("rejects invalid payment data before calling Stripe", async () => {
      const result = await new StripeService().createOrder({ ...orderData, items: [] });
      expect(result).toEqual({ success: false, error: "Invalid payment data" });
      expect(sessionsCreateMock).not.toHaveBeenCalled();
    });

    it("fails cleanly when the secret key is missing", async () => {
      Reflect.deleteProperty(process.env, "STRIPE_SECRET_KEY");
      const result = await new StripeService().createOrder(orderData);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/STRIPE_SECRET_KEY is not configured/);
    });
  });

  describe("capturePayment", () => {
    it("succeeds for a paid session and returns the PaymentIntent id", async () => {
      sessionsRetrieveMock.mockResolvedValue({
        id: "cs_1",
        payment_status: "paid",
        payment_intent: { id: "pi_1" },
      });
      const result = await new StripeService().capturePayment("cs_1");
      expect(sessionsRetrieveMock).toHaveBeenCalledWith("cs_1", { expand: ["payment_intent"] });
      expect(result).toMatchObject({ success: true, paymentId: "cs_1", captureId: "pi_1" });
    });

    it("leaves captureId undefined when payment_intent was not expanded", async () => {
      sessionsRetrieveMock.mockResolvedValue({ id: "cs_1", payment_status: "paid", payment_intent: "pi_1" });
      const result = await new StripeService().capturePayment("cs_1");
      expect(result.success).toBe(true);
      expect(result.captureId).toBeUndefined();
    });

    it("fails for an unpaid session", async () => {
      sessionsRetrieveMock.mockResolvedValue({ id: "cs_1", payment_status: "unpaid" });
      const result = await new StripeService().capturePayment("cs_1");
      expect(result).toEqual({ success: false, error: "Payment not completed (status: unpaid)" });
    });

    it("returns an error when Stripe throws", async () => {
      sessionsRetrieveMock.mockRejectedValue(new Error("No such checkout session"));
      const result = await new StripeService().capturePayment("cs_missing");
      expect(result).toEqual({ success: false, error: "No such checkout session" });
    });
  });

  describe("getOrderDetails", () => {
    it("returns the session", async () => {
      sessionsRetrieveMock.mockResolvedValue({ id: "cs_1" });
      const result = await new StripeService().getOrderDetails("cs_1");
      expect(result).toMatchObject({ success: true, paymentId: "cs_1", orderId: "cs_1" });
    });

    it("returns an error when Stripe throws", async () => {
      sessionsRetrieveMock.mockRejectedValue(new Error("boom"));
      expect(await new StripeService().getOrderDetails("cs_1")).toEqual({ success: false, error: "boom" });
    });
  });

  it("is a redirect + checkout based provider", () => {
    const service = new StripeService();
    expect(service.isRedirectBased()).toBe(true);
    expect(service.isCheckoutBased()).toBe(true);
    expect(service.isClientSecretBased()).toBe(false);
    expect(service.getName()).toBe("STRIPE");
    expect(service.validatePayment(orderData)).toBe(true);
  });
});
