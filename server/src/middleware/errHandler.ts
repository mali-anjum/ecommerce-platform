import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { createLogger } from "../utils/logger";
import {
  ApiError,
  ValidationError,
  InternalServerError,
  NotFoundError,
} from "../utils/ApiError";
import { AuthenticatedRequest } from "../types/express";
import { sentryTracker } from "../lib/monitoring";

const errorLogger = createLogger("ERROR_HANDLER");

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;

  // structured log. Be defensive: properties may be undefined
  try {
    errorLogger.error(error, {
      path: req.path,
      method: req.method,
      userId: authReq.user?.userId ?? null,
      ip: req.ip,
      userAgent: req.get("User-Agent") ?? null,
      body: process.env.NODE_ENV === "development" ? req.body : undefined,
      query: process.env.NODE_ENV === "development" ? req.query : undefined,
    });
  } catch (logErr) {
    // if logging fails, don't crash the handler
    console.error("Error while logging error:", logErr);
  }

  let processedError: ApiError | null = null;

  // 1) Multer errors (file upload related)
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_UNEXPECTED_FILE":
        processedError = new ValidationError(
          "Unexpected file field. Check your form-data keys."
        );
        break;
      case "LIMIT_FILE_SIZE":
        processedError = new ValidationError("File too large");
        break;
      case "LIMIT_PART_COUNT":
      case "LIMIT_FILE_COUNT":
      case "LIMIT_FIELD_KEY":
      case "LIMIT_FIELD_VALUE":
      default:
        processedError = new ValidationError(error.message || "File upload error");
    }
  }
  // 2) Known error shapes
  else if (error && error.name === "ValidationError") {
    processedError = new ValidationError(error.message || "Input validation failed");
  } else if (error && error.name === "CastError") {
    processedError = new NotFoundError(error.message || "Resource not found");
  } else if (error && error.code && typeof error.code === "string" && error.code.startsWith("P")) {
    // Prisma errors
    switch (error.code) {
      case "P2002":
        processedError = new ValidationError("Duplicate field value");
        break;
      case "P2025":
        processedError = new NotFoundError("Record not found");
        break;
      default:
        processedError = new ApiError(400, "Database operation failed");
    }
  }

  // 3) If the error is already an ApiError subclass, use it
  if (!processedError) {
    if (error instanceof ApiError) {
      processedError = error;
    } else {
      // fallback: wrap into InternalServerError (do not expose raw message in prod)
      const message =
        process.env.NODE_ENV === "development" && error && error.message
          ? String(error.message)
          : "Internal server error";
      processedError = new InternalServerError(message);
    }
  }

  sentryTracker(error, {
    source: "errorHandler",
    route: req.path,
    method: req.method,
    userId: authReq.user?.userId ?? null,
    extra: {
      processedStatus: processedError.statusCode,
      processedName: processedError.name,
      isOperational: processedError.isOperational,
    },
  });

  // compose response payload
  const payload: any = {
    success: false,
    message: processedError.message,
    errors: processedError.errors || [],
  };

  if (process.env.NODE_ENV === "development") {
    payload.stack = processedError.stack;
    payload.originalError = error && error.message ? String(error.message) : undefined;
  }

  res.status(processedError.statusCode || 500).json(payload);
};
