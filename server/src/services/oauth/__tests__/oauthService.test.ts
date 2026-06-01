import { mapProviderId } from "../oauthAccountService";

describe("mapProviderId", () => {
  it("maps supported provider slugs", () => {
    expect(mapProviderId("google")).toBe("GOOGLE");
    expect(mapProviderId("GITHUB")).toBe("GITHUB");
    expect(mapProviderId("microsoft")).toBe("MICROSOFT");
  });

  it("returns null for unsupported providers", () => {
    expect(mapProviderId("twitter")).toBeNull();
    expect(mapProviderId("")).toBeNull();
  });
});
