import type { NextFunction, Response } from "express";

const addressUpdateMany = jest.fn();
const addressCreate = jest.fn();
const addressFindMany = jest.fn();
const addressFindFirst = jest.fn();
const addressUpdate = jest.fn();
const addressDelete = jest.fn();
const orderCount = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    address: {
      updateMany: (...a: unknown[]) => addressUpdateMany(...a),
      create: (...a: unknown[]) => addressCreate(...a),
      findMany: (...a: unknown[]) => addressFindMany(...a),
      findFirst: (...a: unknown[]) => addressFindFirst(...a),
      update: (...a: unknown[]) => addressUpdate(...a),
      delete: (...a: unknown[]) => addressDelete(...a),
    },
    order: { count: (...a: unknown[]) => orderCount(...a) },
  },
}));

import { createAddress, deleteAddress, getAddresses, updateAddress } from "../addressController";

type FakeRes = Response & { status: jest.Mock; json: jest.Mock };
function buildRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
async function run(handler: typeof createAddress, req: Record<string, unknown>) {
  const res = buildRes();
  const next = jest.fn() as NextFunction & jest.Mock;
  handler({ params: {}, body: {}, user: { userId: "u1", email: "a@b.co" }, ...req } as never, res, next);
  await new Promise((r) => setImmediate(r));
  return { res, next };
}

const input = {
  name: "Ann",
  address: "1 Main St",
  city: "Lahore",
  country: "PK",
  postalCode: "54000",
  phone: "+92 300 1234567",
  isDefault: false,
};

beforeEach(() => jest.clearAllMocks());

describe("createAddress", () => {
  it("returns 401 when unauthenticated", async () => {
    const { next } = await run(createAddress, { user: undefined, validatedData: input });
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("creates for the authenticated user only, ignoring body userId", async () => {
    addressCreate.mockResolvedValueOnce({ id: "a1" });
    const { res } = await run(createAddress, { validatedData: input, body: { userId: "victim" } });
    expect(addressCreate).toHaveBeenCalledWith({ data: { userId: "u1", ...input } });
    expect(addressUpdateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("clears other defaults when creating a default address", async () => {
    addressCreate.mockResolvedValueOnce({ id: "a1" });
    await run(createAddress, { validatedData: { ...input, isDefault: true } });
    expect(addressUpdateMany).toHaveBeenCalledWith({ where: { userId: "u1" }, data: { isDefault: false } });
    expect(addressCreate.mock.calls[0][0].data.isDefault).toBe(true);
  });
});

describe("getAddresses", () => {
  it("lists only the user's addresses, newest first", async () => {
    addressFindMany.mockResolvedValueOnce([{ id: "a1" }]);
    const { res } = await run(getAddresses, {});
    expect(addressFindMany).toHaveBeenCalledWith({ where: { userId: "u1" }, orderBy: { createdAt: "desc" } });
    expect(res.json).toHaveBeenCalledWith({ success: true, address: [{ id: "a1" }] });
  });
});

describe("updateAddress", () => {
  it("returns 404 for another user's address", async () => {
    addressFindFirst.mockResolvedValueOnce(null);
    const { res } = await run(updateAddress, { params: { id: "a9" }, validatedData: input });
    expect(addressFindFirst).toHaveBeenCalledWith({ where: { id: "a9", userId: "u1" } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(addressUpdate).not.toHaveBeenCalled();
  });

  it("updates an owned address", async () => {
    addressFindFirst.mockResolvedValueOnce({ id: "a1" });
    addressUpdate.mockResolvedValueOnce({ id: "a1", ...input });
    const { res } = await run(updateAddress, { params: { id: "a1" }, validatedData: { ...input, isDefault: true } });
    expect(addressUpdateMany).toHaveBeenCalledWith({ where: { userId: "u1" }, data: { isDefault: false } });
    expect(addressUpdate).toHaveBeenCalledWith({ where: { id: "a1" }, data: { ...input, isDefault: true } });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteAddress", () => {
  it("returns 404 for another user's address", async () => {
    addressFindFirst.mockResolvedValueOnce(null);
    const { res } = await run(deleteAddress, { params: { id: "a9" } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(addressDelete).not.toHaveBeenCalled();
  });

  it("refuses to delete an address used by orders (would cascade-delete them)", async () => {
    addressFindFirst.mockResolvedValueOnce({ id: "a1" });
    orderCount.mockResolvedValueOnce(2);
    const { res } = await run(deleteAddress, { params: { id: "a1" } });
    expect(orderCount).toHaveBeenCalledWith({ where: { addressId: "a1" } });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(addressDelete).not.toHaveBeenCalled();
  });

  it("deletes an unused owned address", async () => {
    addressFindFirst.mockResolvedValueOnce({ id: "a1" });
    orderCount.mockResolvedValueOnce(0);
    const { res } = await run(deleteAddress, { params: { id: "a1" } });
    expect(addressDelete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
