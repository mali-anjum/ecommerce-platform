import {
  getAvailablePaymentMethods,
  isPayPalConfigured,
  isStripeConfigured,
  normalizePaymentMethod,
} from "../paymentMethod";

describe("paymentMethod", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.PAYPAL_CLIENT_ID = "";
    process.env.PAYPAL_CLIENT_SECRET = "";
    process.env.PAYPAL_RETURN_URL = "";
    process.env.PAYPAL_CANCEL_URL = "";
    process.env.STRIPE_SECRET_KEY = "";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("maps CARD and CREDIT_CARD to STRIPE", () => {
    expect(normalizePaymentMethod("CARD")).toBe("STRIPE");
    expect(normalizePaymentMethod("credit_card")).toBe("STRIPE");
    expect(normalizePaymentMethod("STRIPE")).toBe("STRIPE");
  });

  it("returns available methods only when configured", () => {
    process.env.PAYPAL_CLIENT_ID = "id";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    process.env.PAYPAL_RETURN_URL = "http://localhost:3012/paypal/return";
    process.env.PAYPAL_CANCEL_URL = "http://localhost:3012/paypal/cancel";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";

    expect(isPayPalConfigured()).toBe(true);
    expect(isStripeConfigured()).toBe(true);
    expect(getAvailablePaymentMethods()).toEqual(["PAYPAL", "STRIPE"]);
  });
});
