/**
 * PayPal service configuration must not require webhook ID for checkout flows.
 */
jest.mock("axios", () => {
  const mockAxios: any = jest.fn();
  mockAxios.post = jest.fn();
  return {
    __esModule: true,
    default: mockAxios,
  };
});

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

describe("PayPalService capture idempotency", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.PAYPAL_CLIENT_ID = "test-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
    process.env.PAYPAL_MODE = "sandbox";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("treats ORDER_ALREADY_CAPTURED as success when order is completed", async () => {
    const axiosModule = require("axios");
    const axios = axiosModule.default as jest.Mock & { post: jest.Mock };
    const { PayPalService } = require("../paypal.service");

    axios.mockReset();
    axios.post.mockReset();
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: "token-1",
        expires_in: 3600,
        token_type: "Bearer",
      },
    });
    axios
      // POST /capture -> already captured
      .mockRejectedValueOnce({
        response: {
          data: {
            name: "UNPROCESSABLE_ENTITY",
            message: "The requested action could not be performed.",
            details: [{ issue: "ORDER_ALREADY_CAPTURED" }],
          },
        },
      })
      // GET /orders/:id -> completed
      .mockResolvedValueOnce({
        data: {
          id: "PAYPAL-ORDER-1",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [{ id: "CAPTURE-1" }],
              },
            },
          ],
          links: [],
        },
      });

    const svc = new PayPalService();
    const result = await svc.capturePayment("PAYPAL-ORDER-1");

    expect(result.success).toBe(true);
    expect(result.captureId).toBe("CAPTURE-1");
    expect(result.paymentId).toBe("CAPTURE-1");
  });
});
