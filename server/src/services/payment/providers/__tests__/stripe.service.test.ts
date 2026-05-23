const sessionsCreateMock = jest.fn();
const sessionsRetrieveMock = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => sessionsCreateMock(...args),
        retrieve: (...args: unknown[]) => sessionsRetrieveMock(...args),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

import { StripeService } from "../stripe.service";

describe("StripeService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_mock",
      STRIPE_CHECKOUT_BASE_URL: "http://localhost:3012",
    };
    sessionsCreateMock.mockReset();
    sessionsRetrieveMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects when line total exceeds order total", async () => {
    const service = new StripeService();
    const result = await service.createOrder({
      items: [
        {
          productId: "p1",
          productName: "Widget",
          productCategory: "General",
          quantity: 1,
          price: 50,
        },
      ],
      total: 40,
      userId: "user-1",
      currency: "USD",
      internalOrderId: "order-1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/less than/i);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });

  it("creates checkout session with shipping line when total includes fees", async () => {
    sessionsCreateMock.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/test",
    });

    const service = new StripeService();
    const result = await service.createOrder({
      items: [
        {
          productId: "p1",
          productName: "Widget",
          productCategory: "General",
          quantity: 2,
          price: 25,
        },
      ],
      total: 59.99,
      userId: "user-1",
      currency: "USD",
      internalOrderId: "order-1",
    });

    expect(result.success).toBe(true);
    expect(result.url).toBe("https://checkout.stripe.com/test");
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining("/stripe/return"),
        cancel_url: expect.stringContaining("/stripe/cancel"),
        client_reference_id: "order-1",
        line_items: expect.arrayContaining([
          expect.objectContaining({ quantity: 2 }),
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: expect.objectContaining({
                name: "Shipping, tax & fees",
              }),
            }),
          }),
        ]),
      })
    );
  });
});
