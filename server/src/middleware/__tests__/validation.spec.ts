import type { NextFunction, Response } from "express";
import { z } from "zod";

const sentryTracker = jest.fn();
jest.mock("../../lib/monitoring", () => ({ sentryTracker: (...a: unknown[]) => sentryTracker(...a) }));

import { validate } from "../validation";

function buildRes() {
  const res = {} as Response & { status: jest.Mock; json: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const schema = z.object({ name: z.string().min(2), nested: z.object({ n: z.number() }) });

describe("validate middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores parsed data and calls next on success", () => {
    const req = { body: { name: "Al", nested: { n: 1 }, extra: true } } as never as { validatedData?: unknown };
    const next = jest.fn() as NextFunction;
    validate(schema)(req as never, buildRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validatedData).toEqual({ name: "Al", nested: { n: 1 } });
  });

  it("returns 400 with field paths and does not report user errors to Sentry", () => {
    const res = buildRes();
    const next = jest.fn() as NextFunction;
    validate(schema)({ body: { name: "A", nested: { n: "x" } } } as never, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.errors.map((e: { field: string }) => e.field).sort()).toEqual(["name", "nested.n"]);
    expect(sentryTracker).not.toHaveBeenCalled();
  });

  it("returns 500 and reports unexpected failures", () => {
    const broken = { parse: () => { throw new Error("boom"); } } as unknown as z.ZodSchema;
    const res = buildRes();
    validate(broken)({ body: {} } as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(sentryTracker).toHaveBeenCalled();
  });
});
