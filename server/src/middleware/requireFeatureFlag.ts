import { NextFunction, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedRequest } from "../types/express";
import { isFeatureEnabled } from "../config/featureFlags";

/**
 * Rejects the request when any required flag is off (403).
 * Use on expensive or module-specific routes so production callers cannot bypass the UI.
 */
export function requireFeatureFlag(...keys: string[]) {
  return (
    _req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    const blocked = keys.find((key) => !isFeatureEnabled(key));
    if (blocked) {
      next(
        new ApiError(
          403,
          `Feature "${blocked}" is disabled in feature-flags.config.json`,
        ),
      );
      return;
    }
    next();
  };
}

/** Shorthand for module master switch, e.g. requireModule("ai"). */
export function requireModule(module: string) {
  return requireFeatureFlag(`${module}.enabled`);
}
