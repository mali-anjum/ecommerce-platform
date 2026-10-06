import { handleApiError } from "../handleApiError";

describe("handleApiError", () => {
  beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("returns the server message when present", () => {
    expect(handleApiError({ response: { status: 400, data: { message: "Bad page size" } } })).toBe("Bad page size");
  });

  it("falls back to a generic message", () => {
    expect(handleApiError(new Error("Network Error"))).toBe("An error occurred");
    expect(handleApiError({})).toBe("An error occurred");
  });

  it("flags 401s", () => {
    handleApiError({ response: { status: 401 } });
    expect(console.warn).toHaveBeenCalledWith("Authentication required");
  });
});
