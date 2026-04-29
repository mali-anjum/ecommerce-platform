const productFindManyMock = jest.fn();
const orderUpdateMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => productFindManyMock(...args),
    },
    order: {
      update: (...args: unknown[]) => orderUpdateMock(...args),
    },
  },
}));

import type { OrderStatus } from "@prisma/client";
import {
  resolveSellerIdsForProductIds,
  updateOrderStatusById,
} from "../write";

describe("resolveSellerIdsForProductIds", () => {
  beforeEach(() => {
    productFindManyMock.mockReset();
  });

  it("returns empty map for empty ids", async () => {
    const m = await resolveSellerIdsForProductIds([]);
    expect(m.size).toBe(0);
    expect(productFindManyMock).not.toHaveBeenCalled();
  });

  it("maps product ids to seller ids", async () => {
    productFindManyMock.mockResolvedValueOnce([
      { id: "p1", sellerId: "s1" },
      { id: "p2", sellerId: null },
    ]);

    const m = await resolveSellerIdsForProductIds(["p1", "p2"]);

    expect(productFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["p1", "p2"] } },
      })
    );
    expect(m.get("p1")).toBe("s1");
    expect(m.get("p2")).toBeNull();
  });
});

describe("updateOrderStatusById", () => {
  beforeEach(() => {
    orderUpdateMock.mockReset();
  });

  it("updates order status", async () => {
    orderUpdateMock.mockResolvedValueOnce({ id: "o1", status: "SHIPPED" });

    await updateOrderStatusById("o1", "SHIPPED" as OrderStatus);

    expect(orderUpdateMock).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { status: "SHIPPED" },
    });
  });
});
