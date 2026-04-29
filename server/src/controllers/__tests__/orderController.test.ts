import type { NextFunction, Response } from "express";

const orderFindFirstMock = jest.fn();
const orderFindManyMock = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: {
    order: {
      findFirst: (...args: unknown[]) => orderFindFirstMock(...args),
      findMany: (...args: unknown[]) => orderFindManyMock(...args),
    },
  },
}));

import { getAllOrdersForUser, trackOrderPublic } from "../orderController";

describe("trackOrderPublic", () => {
  it("returns order when orderId/email match", async () => {
    orderFindFirstMock.mockResolvedValueOnce({
      id: "ord-123",
      status: "SHIPPED",
      items: [],
      address: {},
    });

    const req = {
      body: {
        orderId: "ord-123",
        email: "user@example.com",
      },
    } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    trackOrderPublic(req, res, next);
    await new Promise(process.nextTick);

    expect(orderFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "ord-123",
          user: expect.objectContaining({
            email: expect.objectContaining({
              equals: "user@example.com",
            }),
          }),
        }),
      })
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with validation error when input missing", async () => {
    const req = { body: { orderId: "", email: "" } } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    trackOrderPublic(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "orderId and email are required",
      })
    );
  });

  it("calls next with 404 when order not found", async () => {
    orderFindFirstMock.mockResolvedValueOnce(null);

    const req = {
      body: {
        orderId: "ord-unknown",
        email: "user@example.com",
      },
    } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    trackOrderPublic(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No order found for provided details",
      })
    );
  });
});

describe("getAllOrdersForUser", () => {
  it("returns authenticated user orders only", async () => {
    orderFindManyMock.mockResolvedValueOnce([{ id: "ord-1" }, { id: "ord-2" }]);

    const req = { user: { userId: "user-1" } } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    getAllOrdersForUser(req, res, next);
    await new Promise(process.nextTick);

    expect(orderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("fails for unauthenticated users", async () => {
    const req = { user: undefined } as any;
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = jest.fn() as NextFunction;

    getAllOrdersForUser(req, res, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unauthenticated user",
      })
    );
  });
});
