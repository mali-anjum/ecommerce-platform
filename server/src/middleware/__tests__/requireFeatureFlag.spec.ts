jest.mock("../../config/featureFlags", () => ({ isFeatureEnabled: jest.fn() }));

import type { Response } from "express";
import { requireFeatureFlag, requireModule } from "../requireFeatureFlag";
import { isFeatureEnabled } from "../../config/featureFlags";
import { ApiError } from "../../utils/ApiError";
import type { AuthenticatedRequest } from "../../types/express";

const flags = isFeatureEnabled as jest.Mock;

function call(middleware: ReturnType<typeof requireFeatureFlag>) {
  const next = jest.fn();
  middleware({} as AuthenticatedRequest, {} as Response, next);
  return next;
}

describe("requireFeatureFlag", () => {
  beforeEach(() => flags.mockReset());

  it("calls next() with no error when every flag is on", () => {
    flags.mockReturnValue(true);
    const next = call(requireFeatureFlag("ai.enabled", "ai.chat"));
    expect(next).toHaveBeenCalledWith();
    expect(flags).toHaveBeenCalledWith("ai.chat");
  });

  it("blocks with 403 naming the first disabled flag", () => {
    flags.mockImplementation((key: string) => key !== "ai.chat");
    const next = call(requireFeatureFlag("ai.enabled", "ai.chat", "ai.voice"));
    const error = next.mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('"ai.chat"');
  });

  it("requireModule checks the module master switch", () => {
    flags.mockReturnValue(false);
    const next = call(requireModule("ai"));
    expect(flags).toHaveBeenCalledWith("ai.enabled");
    expect((next.mock.calls[0][0] as ApiError).statusCode).toBe(403);
  });
});
