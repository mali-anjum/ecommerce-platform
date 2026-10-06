const scope = { setTag: jest.fn(), setUser: jest.fn(), setContext: jest.fn() };
const captureException = jest.fn();

jest.mock("@sentry/node", () => ({
  withScope: (fn: (s: typeof scope) => void) => fn(scope),
  captureException: (...args: unknown[]) => captureException(...args),
}));
jest.mock("../sentryConfig", () => ({ isSentryEnabled: jest.fn() }));

import { isSentryEnabled } from "../sentryConfig";
import { sentryTracker } from "../sentryTracker";

describe("sentryTracker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isSentryEnabled as jest.Mock).mockReturnValue(true);
  });

  it("is a no-op when Sentry is disabled", () => {
    (isSentryEnabled as jest.Mock).mockReturnValue(false);
    sentryTracker(new Error("x"), { source: "test" });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures Errors with tags, user, context and status code", () => {
    const error = Object.assign(new TypeError("bad"), { statusCode: 422 });
    sentryTracker(error, { source: "svc", route: "/api/x", method: "POST", userId: "u1", extra: { a: 1 } });

    expect(captureException).toHaveBeenCalledWith(error);
    expect(scope.setTag.mock.calls).toEqual(
      expect.arrayContaining([
        ["source", "svc"],
        ["route", "/api/x"],
        ["method", "POST"],
        ["status_code", "422"],
        ["error_name", "TypeError"],
      ])
    );
    expect(scope.setUser).toHaveBeenCalledWith({ id: "u1" });
    expect(scope.setContext).toHaveBeenCalledWith("details", { a: 1 });
  });

  it.each<[unknown, string]>([
    ["plain string", "plain string"],
    [undefined, "Unknown error"],
    [null, "Unknown error"],
    [{ message: "from object" }, "from object"],
    [{ error: "from error field" }, "from error field"],
    [{ code: 7 }, '{"code":7}'],
  ])("normalizes %p into an Error", (value, message) => {
    sentryTracker(value);
    const captured = captureException.mock.calls[0][0] as Error;
    expect(captured).toBeInstanceOf(Error);
    expect(captured.message).toBe(message);
    expect(scope.setUser).not.toHaveBeenCalled();
  });
});
