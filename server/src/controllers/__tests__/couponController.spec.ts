import { Prisma } from "@prisma/client";
import type { Response } from "express";

const couponCreate = jest.fn();
const couponFindMany = jest.fn();
const couponFindUnique = jest.fn();
const couponDelete = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    coupon: {
      create: (...a: unknown[]) => couponCreate(...a),
      findMany: (...a: unknown[]) => couponFindMany(...a),
      findUnique: (...a: unknown[]) => couponFindUnique(...a),
      delete: (...a: unknown[]) => couponDelete(...a),
    },
  },
}));
jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));

import { createCoupon, deleteCoupon, fetchAllCoupons, validateCoupon } from "../couponController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "test" });

const activeCoupon = {
  id: "c1",
  code: "SAVE10",
  discountPercent: 10,
  isActive: true,
  startDate: new Date(Date.now() - 86_400_000),
  endDate: new Date(Date.now() + 86_400_000),
  usageLimit: 5,
  usageCount: 0,
  minOrderValue: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe("createCoupon", () => {
  const validatedData = {
    code: "SAVE10",
    discountPercent: 10,
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-07-01"),
    usageLimit: 5,
  };

  it("creates from validated data with zero usage", async () => {
    couponCreate.mockResolvedValueOnce({ id: "c1", ...validatedData });
    const res = buildRes();
    await createCoupon({ validatedData, body: { usageCount: 999 } } as never, res);
    expect(couponCreate).toHaveBeenCalledWith({ data: { ...validatedData, usageCount: 0 } });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 409 for a duplicate code", async () => {
    couponCreate.mockRejectedValueOnce(prismaError("P2002"));
    const res = buildRes();
    await createCoupon({ validatedData } as never, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("returns 500 for unexpected errors", async () => {
    couponCreate.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await createCoupon({ validatedData } as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("fetchAllCoupons", () => {
  it("returns the list with 200", async () => {
    couponFindMany.mockResolvedValueOnce([activeCoupon]);
    const res = buildRes();
    await fetchAllCoupons({} as never, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].couponList).toEqual([activeCoupon]);
  });

  it("returns 500 on failure", async () => {
    couponFindMany.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await fetchAllCoupons({} as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("validateCoupon", () => {
  it("returns only the fields checkout needs for a valid code", async () => {
    couponFindUnique.mockResolvedValueOnce(activeCoupon);
    const res = buildRes();
    await validateCoupon({ validatedData: { code: "SAVE10" } } as never, res);
    expect(couponFindUnique).toHaveBeenCalledWith({ where: { code: "SAVE10" } });
    expect(res.status).toHaveBeenCalledWith(200);
    const { coupon } = res.json.mock.calls[0][0];
    expect(coupon).toEqual({
      id: "c1",
      code: "SAVE10",
      discountPercent: 10,
      endDate: activeCoupon.endDate,
      minOrderValue: null,
    });
    expect(coupon).not.toHaveProperty("usageLimit");
  });

  it("returns 404 for unknown codes", async () => {
    couponFindUnique.mockResolvedValueOnce(null);
    const res = buildRes();
    await validateCoupon({ validatedData: { code: "NOPE" } } as never, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it.each([
    [{ endDate: new Date(Date.now() - 1000) }, "Coupon has expired"],
    [{ usageCount: 5 }, "Coupon has reached its usage limit"],
    [{ isActive: false }, "Coupon is not active"],
  ])("returns 400 for unusable coupons %o", async (override, message) => {
    couponFindUnique.mockResolvedValueOnce({ ...activeCoupon, ...override });
    const res = buildRes();
    await validateCoupon({ validatedData: { code: "SAVE10" } } as never, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message });
  });

  it("returns 500 when the lookup fails", async () => {
    couponFindUnique.mockRejectedValueOnce(new Error("db"));
    const res = buildRes();
    await validateCoupon({ validatedData: { code: "SAVE10" } } as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("deleteCoupon", () => {
  it("deletes by id", async () => {
    couponDelete.mockResolvedValueOnce({});
    const res = buildRes();
    await deleteCoupon({ params: { id: "c1" } } as never, res);
    expect(couponDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when the coupon does not exist", async () => {
    couponDelete.mockRejectedValueOnce(prismaError("P2025"));
    const res = buildRes();
    await deleteCoupon({ params: { id: "missing" } } as never, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 500 for other failures", async () => {
    couponDelete.mockRejectedValueOnce(prismaError("P2003"));
    const res = buildRes();
    await deleteCoupon({ params: { id: "c1" } } as never, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
