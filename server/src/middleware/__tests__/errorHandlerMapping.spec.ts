jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));
jest.mock("../../utils/logger", () => ({ createLogger: () => ({ error: jest.fn() }) }));

import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { errorHandler } from "../errHandler";
import { ApiError, NotFoundError } from "../../utils/ApiError";
import { sentryTracker } from "../../lib/monitoring";

type JsonBody = { success: boolean; message: string; errors: unknown[]; stack?: string; originalError?: string };

function run(error: unknown) {
  const req = { path: "/api/x", method: "POST", ip: "1.1.1.1", body: {}, query: {}, get: () => "jest" } as unknown as Request;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
  errorHandler(error, req, res, jest.fn() as NextFunction);
  return { status: res.status.mock.calls[0][0] as number, body: res.json.mock.calls[0][0] as JsonBody };
}

describe("errorHandler status mapping", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it.each([
    ["LIMIT_FILE_SIZE", "File too large"],
    ["LIMIT_UNEXPECTED_FILE", "Unexpected file field. Check your form-data keys."],
  ] as const)("maps multer %s to 400", (code, message) => {
    expect(run(new multer.MulterError(code))).toMatchObject({ status: 400, body: { success: false, message } });
  });

  it("maps other multer errors to 400 with multer's message", () => {
    const result = run(new multer.MulterError("LIMIT_FILE_COUNT"));
    expect(result.status).toBe(400);
    expect(result.body.message).toBe("Too many files");
  });

  it("maps Prisma P2002 to 400 and P2025 to 404 without leaking the query", () => {
    expect(run({ code: "P2002", message: "Unique constraint failed on users.email" })).toMatchObject({
      status: 400,
      body: { message: "Duplicate field value" },
    });
    expect(run({ code: "P2025", message: "No record" })).toMatchObject({ status: 404, body: { message: "Record not found" } });
    expect(run({ code: "P1001", message: "Can't reach db at 10.0.0.1" })).toMatchObject({
      status: 400,
      body: { message: "Database operation failed" },
    });
  });

  it("maps named ValidationError / CastError shapes", () => {
    expect(run({ name: "ValidationError", message: "bad email" })).toMatchObject({ status: 400, body: { message: "bad email" } });
    expect(run({ name: "CastError", message: "" })).toMatchObject({ status: 404, body: { message: "Resource not found" } });
  });

  it("passes ApiError subclasses through with their status and errors", () => {
    expect(run(new ApiError(409, "Conflict", [{ field: "code" }]))).toEqual({
      status: 409,
      body: { success: false, message: "Conflict", errors: [{ field: "code" }] },
    });
    expect(run(new NotFoundError("Order not found")).status).toBe(404);
  });

  it("hides raw messages and stacks of unknown errors in production", () => {
    const result = run(new Error("connect ECONNREFUSED postgres://user:pw@db"));
    expect(result).toEqual({ status: 500, body: { success: false, message: "Internal server error", errors: [] } });
  });

  it("includes the message and stack in development", () => {
    process.env.NODE_ENV = "development";
    const result = run(new Error("boom"));
    expect(result.status).toBe(500);
    expect(result.body.message).toBe("boom");
    expect(result.body.originalError).toBe("boom");
    expect(typeof result.body.stack).toBe("string");
  });

  it("reports every error to Sentry with the processed status", () => {
    run(new NotFoundError());
    expect(sentryTracker).toHaveBeenCalledWith(
      expect.any(NotFoundError),
      expect.objectContaining({ route: "/api/x", method: "POST", extra: expect.objectContaining({ processedStatus: 404 }) })
    );
  });

  it("handles null/undefined errors as 500", () => {
    expect(run(null).status).toBe(500);
    expect(run(undefined).status).toBe(500);
  });
});
