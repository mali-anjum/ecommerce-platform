const productUpdateMock = jest.fn();
const couponUpdateMock = jest.fn();
const cartItemDeleteManyMock = jest.fn();
const cartDeleteMock = jest.fn();
const scheduleAiChatConversionMock = jest.fn();
const scheduleSalesOfferConversionMock = jest.fn();
const scheduleAnalyticsEventMock = jest.fn();
const scheduleProductIndexSyncMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      update: (...args: unknown[]) => productUpdateMock(...args),
    },
    coupon: {
      update: (...args: unknown[]) => couponUpdateMock(...args),
    },
    cartItem: {
      deleteMany: (...args: unknown[]) => cartItemDeleteManyMock(...args),
    },
    cart: {
      delete: (...args: unknown[]) => cartDeleteMock(...args),
    },
  },
}));

jest.mock("../../ai/analytics/ConversationLogService", () => ({
  scheduleAiChatConversion: (...args: unknown[]) =>
    scheduleAiChatConversionMock(...args),
}));

jest.mock("../../ai/sales", () => ({
  scheduleSalesOfferConversion: (...args: unknown[]) =>
    scheduleSalesOfferConversionMock(...args),
}));

jest.mock("../../analytics/analyticsEventService", () => ({
  scheduleAnalyticsEvent: (...args: unknown[]) =>
    scheduleAnalyticsEventMock(...args),
}));

jest.mock("../../ai/productIndex", () => ({
  scheduleProductIndexSync: (...args: unknown[]) =>
    scheduleProductIndexSyncMock(...args),
}));

import { AnalyticsEventType } from "@prisma/client";
import {
  applyPurchaseFulfillment,
  buildFulfillmentAnalyticsContext,
  parsePurchasedCartItemIds,
} from "../fulfillment";

describe("fulfillment analytics helpers", () => {
  it("builds analytics context from payment metadata", () => {
    expect(
      buildFulfillmentAnalyticsContext(
        { id: "order-1", total: 129.99 },
        {
          sessionId: "session-1",
          visitorId: "visitor-1",
          cartItemIds: ["cart-1"],
        },
      ),
    ).toEqual({
      orderId: "order-1",
      total: 129.99,
      sessionId: "session-1",
      visitorId: "visitor-1",
    });
  });

  it("parses purchased cart item ids from payment metadata", () => {
    expect(
      parsePurchasedCartItemIds({
        cartItemIds: ["cart-1", "cart-2"],
      }),
    ).toEqual(["cart-1", "cart-2"]);
  });
});

describe("applyPurchaseFulfillment", () => {
  beforeEach(() => {
    productUpdateMock.mockReset();
    couponUpdateMock.mockReset();
    cartItemDeleteManyMock.mockReset();
    cartDeleteMock.mockReset();
    scheduleAiChatConversionMock.mockReset();
    scheduleSalesOfferConversionMock.mockReset();
    scheduleAnalyticsEventMock.mockReset();
    scheduleProductIndexSyncMock.mockReset();
    productUpdateMock.mockResolvedValue(undefined);
    couponUpdateMock.mockResolvedValue(undefined);
    cartItemDeleteManyMock.mockResolvedValue({ count: 0 });
    cartDeleteMock.mockResolvedValue(undefined);
  });

  it("schedules conversion analytics when analytics context is provided", async () => {
    await applyPurchaseFulfillment(
      "user-1",
      [{ productId: "p1", quantity: 1 }],
      ["cart-item-1"],
      {
        orderId: "order-1",
        total: 50,
        sessionId: "session-1",
        visitorId: "visitor-1",
      },
    );

    expect(scheduleAiChatConversionMock).toHaveBeenCalledWith("user-1");
    expect(scheduleSalesOfferConversionMock).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
      visitorId: "visitor-1",
    });
    expect(scheduleAnalyticsEventMock).toHaveBeenCalledWith({
      type: AnalyticsEventType.ORDER_COMPLETE,
      userId: "user-1",
      sessionId: "session-1",
      metadata: {
        orderId: "order-1",
        total: 50,
        visitorId: "visitor-1",
      },
    });
  });

  it("updates stock for lines with productId and clears cart", async () => {
    await applyPurchaseFulfillment("user-1", [
      { productId: "p1", quantity: 2 },
      { productId: null, quantity: 1 },
    ]);

    expect(productUpdateMock).toHaveBeenCalledTimes(1);
    expect(cartItemDeleteManyMock).toHaveBeenCalled();
    expect(cartDeleteMock).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("removes only purchased cart item ids when provided", async () => {
    await applyPurchaseFulfillment(
      "user-1",
      [{ productId: "p1", quantity: 1 }],
      ["cart-item-1", "cart-item-2"],
    );

    expect(cartItemDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: { in: ["cart-item-1", "cart-item-2"] },
        cart: { userId: "user-1" },
      },
    });
    expect(cartDeleteMock).not.toHaveBeenCalled();
  });

  it("increments coupon when line has couponId", async () => {
    await applyPurchaseFulfillment("user-1", [
      { productId: "p1", quantity: 1, couponId: "c1" },
    ]);

    expect(couponUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { usageCount: { increment: 1 } },
      }),
    );
  });
});
