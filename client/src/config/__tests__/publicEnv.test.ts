describe("publicEnv helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("detects configured PayPal client id", async () => {
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = "ARihhQLyEJVgWRPhWRy7rtW4BH9rypf";
    const { isPayPalSdkConfigured } = await import("../publicEnv");
    expect(isPayPalSdkConfigured()).toBe(true);
  });

  it("detects placeholder Stripe publishable key", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
      "pk_test_your_stripe_publishable_key";
    const { isStripePublishableConfigured } = await import("../publicEnv");
    expect(isStripePublishableConfigured()).toBe(false);
  });

  it("detects valid Stripe publishable key", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_51AbCdEf";
    const { isStripePublishableConfigured } = await import("../publicEnv");
    expect(isStripePublishableConfigured()).toBe(true);
  });
});
