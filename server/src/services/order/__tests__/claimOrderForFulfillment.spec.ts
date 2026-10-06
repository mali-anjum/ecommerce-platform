const orderUpdateManyMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    order: { updateMany: (...args: unknown[]) => orderUpdateManyMock(...args) },
  },
}));

import { FULFILLED_ORDER_STATUSES, claimOrderForFulfillment } from "../write";

describe("claimOrderForFulfillment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("conditionally moves an unpaid order to PROCESSING/COMPLETED in one statement", async () => {
    orderUpdateManyMock.mockResolvedValueOnce({ count: 1 });
    await expect(claimOrderForFulfillment("order-1")).resolves.toBe(true);
    expect(orderUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        status: { notIn: ["PROCESSING", "SHIPPED", "DELIVERED"] },
        paymentStatus: { notIn: ["COMPLETED", "REFUNDED"] },
      },
      data: { status: "PROCESSING", paymentStatus: "COMPLETED" },
    });
  });

  it("returns false when another request already claimed the order", async () => {
    orderUpdateManyMock.mockResolvedValueOnce({ count: 0 });
    await expect(claimOrderForFulfillment("order-1")).resolves.toBe(false);
  });

  it("only one of two concurrent claims wins", async () => {
    let claimed = false;
    orderUpdateManyMock.mockImplementation(async () => {
      const count = claimed ? 0 : 1;
      claimed = true;
      return { count };
    });
    const results = await Promise.all([
      claimOrderForFulfillment("order-1"),
      claimOrderForFulfillment("order-1"),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("treats shipped and delivered orders as fulfilled", () => {
    expect(FULFILLED_ORDER_STATUSES).toEqual(["PROCESSING", "SHIPPED", "DELIVERED"]);
  });
});
