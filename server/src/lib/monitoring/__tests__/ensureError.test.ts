import { ValidationError } from "../../../utils/ApiError";
import { ensureError } from "../ensureError";

describe("ensureError", () => {
  it("returns Error instances unchanged", () => {
    const original = new ValidationError("bad input");
    expect(ensureError(original)).toBe(original);
  });

  it("wraps strings", () => {
    const err = ensureError("failure");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("failure");
  });

  it("wraps plain objects with a message field", () => {
    const err = ensureError({ message: "oops" });
    expect(err.message).toBe("oops");
    expect((err as Error & { cause?: unknown }).cause).toEqual({ message: "oops" });
  });
});
