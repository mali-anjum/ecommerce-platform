/**
 * PayPal service configuration must not require webhook ID for checkout flows.
 */
describe("PayPalService configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.PAYPAL_CLIENT_ID = "test-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
    process.env.PAYPAL_WEBHOOK_ID = "";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("instantiates without PAYPAL_WEBHOOK_ID", () => {
    const { PayPalService } = require("../paypal.service");
    expect(() => new PayPalService()).not.toThrow();
  });

  it("throws when PAYPAL_CLIENT_ID is missing", () => {
    process.env.PAYPAL_CLIENT_ID = "";
    const { PayPalService } = require("../paypal.service");
    expect(() => new PayPalService()).toThrow(/PAYPAL_CLIENT_ID/);
  });

  it("createOrder fails with a clear message when redirect URLs are unset", async () => {
    process.env.PAYPAL_RETURN_URL = "";
    process.env.PAYPAL_CANCEL_URL = "";
    const { PayPalService } = require("../paypal.service");
    const svc = new PayPalService();
    const result = await svc.createOrder({
      items: [
        {
          productId: "p1",
          productName: "Test",
          quantity: 1,
          price: 10,
        },
      ],
      total: 10,
      userId: "u1",
      currency: "USD",
      internalOrderId: "order-1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/PAYPAL_RETURN_URL|PAYPAL_CANCEL_URL/i);
  });
});
