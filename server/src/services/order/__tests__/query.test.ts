const sellerFindUniqueMock = jest.fn();

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    seller: {
      findUnique: (...args: unknown[]) => sellerFindUniqueMock(...args),
    },
  },
}));

import {
  parseListPagination,
  prepareGetOrderByIdQuery,
  totalPages,
} from "../query";

describe("prepareGetOrderByIdQuery", () => {
  beforeEach(() => {
    sellerFindUniqueMock.mockReset();
  });

  it("returns seller error when SELLER has no profile", async () => {
    sellerFindUniqueMock.mockResolvedValueOnce(null);

    const r = await prepareGetOrderByIdQuery({
      orderId: "o1",
      userId: "u1",
      userRole: "SELLER",
    });

    expect(r).toEqual({ ok: false, code: "SELLER_PROFILE_NOT_FOUND" });
  });

  it("scopes SELLER by sellerId on where and item include", async () => {
    sellerFindUniqueMock.mockResolvedValueOnce({ id: "sel-1" });

    const r = await prepareGetOrderByIdQuery({
      orderId: "o1",
      userId: "u1",
      userRole: "SELLER",
    });

    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.where).toEqual({
      id: "o1",
      items: { some: { sellerId: "sel-1" } },
    });
    expect(r.include).toMatchObject({
      address: true,
      coupon: true,
      items: { where: { sellerId: "sel-1" } },
    });
  });

  it("restricts USER to own userId", async () => {
    const r = await prepareGetOrderByIdQuery({
      orderId: "o1",
      userId: "u99",
      userRole: "USER",
    });

    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.where).toEqual({ id: "o1", userId: "u99" });
    expect(r.include).toMatchObject({
      items: true,
      address: true,
      coupon: true,
    });
  });

  it("adds user select for SUPER_ADMIN", async () => {
    const r = await prepareGetOrderByIdQuery({
      orderId: "o1",
      userId: "admin",
      userRole: "SUPER_ADMIN",
    });

    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.where).toEqual({ id: "o1" });
    expect(r.include.user).toEqual({
      select: { id: true, name: true, email: true },
    });
  });
});

describe("parseListPagination", () => {
  it("clamps limit to 100 and computes skip", () => {
    expect(parseListPagination("2", "500")).toEqual({
      page: 2,
      limit: 100,
      skip: 100,
    });
  });
});

describe("totalPages", () => {
  it("returns at least 1", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
  });
});
