jest.mock("stripe", () => jest.fn().mockImplementation(() => ({})));
jest.mock("axios", () => ({ __esModule: true, default: Object.assign(jest.fn(), { post: jest.fn() }) }));
jest.mock("../paymentMethod", () => ({
  ...jest.requireActual("../paymentMethod"),
  getAvailablePaymentMethods: jest.fn(),
}));

import { BasePaymentService } from "../base.payment.service";
import { PaymentFactory } from "../payment.factory";
import { getAvailablePaymentMethods } from "../paymentMethod";
import { PayPalService } from "../providers/paypal.service";
import { StripeService } from "../providers/stripe.service";
import type { PaymentOrderData, PaymentResult } from "../../interfaces/payment.interface";

class TestPaymentService extends BasePaymentService {
  protected providerName = "TEST";

  async createOrder(): Promise<PaymentResult> {
    return { success: true };
  }

  async capturePayment(): Promise<PaymentResult> {
    return { success: true };
  }

  validatePayment(data: PaymentOrderData): boolean {
    return this.validatePaymentData(data);
  }

  total(items: PaymentOrderData["items"]): number {
    return this.calculateItemTotal(items);
  }
}

const item = { productId: "p1", productName: "Widget", productCategory: "General", quantity: 2, price: 5 };
const order = (overrides: Partial<PaymentOrderData> = {}): PaymentOrderData => ({
  items: [item],
  total: 10,
  userId: "u1",
  currency: "USD",
  internalOrderId: "o1",
  ...overrides,
});

describe("PaymentFactory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, PAYPAL_CLIENT_ID: "id", PAYPAL_CLIENT_SECRET: "secret" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it.each([
    ["PAYPAL", PayPalService],
    ["paypal", PayPalService],
    ["STRIPE", StripeService],
    ["card", StripeService],
    [" credit_card ", StripeService],
  ])("creates the right provider for %p", (method, expected) => {
    expect(PaymentFactory.createPaymentService(method)).toBeInstanceOf(expected);
    expect(PaymentFactory.createPaymentMethod(method)).toBeInstanceOf(expected);
  });

  it.each(["", "BITCOIN", "cash"])("throws for unsupported method %p", (method) => {
    expect(() => PaymentFactory.createPaymentService(method)).toThrow(`Unsupported payment method: ${method}`);
  });

  it("propagates PayPal configuration errors instead of returning a half-configured service", () => {
    Reflect.deleteProperty(process.env, "PAYPAL_CLIENT_ID");
    expect(() => PaymentFactory.createPaymentService("PAYPAL")).toThrow(/PAYPAL_CLIENT_ID/);
  });

  it("delegates available methods to the flag/env check", () => {
    (getAvailablePaymentMethods as jest.Mock).mockReturnValue(["STRIPE"]);
    expect(PaymentFactory.getAvailableMethods()).toEqual(["STRIPE"]);
  });
});

describe("BasePaymentService", () => {
  const service = new TestPaymentService();

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("accepts well-formed order data", () => {
    expect(service.validatePayment(order())).toBe(true);
    expect(service.validatePayment(order({ items: [{ ...item, price: 0 }] }))).toBe(true);
  });

  it.each<[string, Partial<PaymentOrderData>]>([
    ["no items", { items: [] }],
    ["zero total", { total: 0 }],
    ["negative total", { total: -5 }],
    ["negative price", { items: [{ ...item, price: -1 }] }],
    ["zero quantity", { items: [{ ...item, quantity: 0 }] }],
    ["non-string productId", { items: [{ ...item, productId: 1 as unknown as string }] }],
    ["string total", { total: "10" as unknown as number }],
  ])("rejects order data with %s", (_label, overrides) => {
    expect(service.validatePayment(order(overrides))).toBe(false);
  });

  it("sums price × quantity across items", () => {
    expect(service.total([item, { ...item, price: 2.5, quantity: 4 }])).toBe(20);
    expect(service.total([])).toBe(0);
  });

  it("has safe defaults for optional provider hooks", async () => {
    expect(service.getName()).toBe("TEST");
    expect(await service.getOrderDetails("x")).toEqual({
      success: false,
      error: "getOrderDetails not implemented for this payment method",
    });
    // Unverifiable webhooks must fail closed.
    expect(await service.verifyWebhookSignature("{}", "sig", "ts", "cert")).toBe(false);
    expect(await service.handleWebhook("{}", "sig")).toEqual({ success: false, error: "Not implemented" });
    expect(service.isRedirectBased()).toBe(false);
    expect(service.isClientSecretBased()).toBe(false);
    expect(service.isCheckoutBased()).toBe(false);
  });
});
