import { OAuthExchangeStore } from "../oauthExchangeStore";

describe("OAuthExchangeStore", () => {
  it("creates a one-time code and returns stored session payload", () => {
    const store = new OAuthExchangeStore();
    const code = store.create({
      accessToken: "access",
      refreshToken: "refresh",
      user: {
        id: "u1",
        email: "a@b.com",
        name: "A",
        role: "USER",
      },
      redirectTo: "/home",
    });

    expect(code.length).toBeGreaterThan(20);
    const entry = store.consume(code);
    expect(entry).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      redirectTo: "/home",
    });
  });

  it("consumes a code only once", () => {
    const store = new OAuthExchangeStore();
    const code = store.create({
      accessToken: "a",
      refreshToken: "r",
      user: { id: "1", email: "x@y.com", name: null, role: "USER" },
      redirectTo: "/home",
    });

    expect(store.consume(code)).not.toBeNull();
    expect(store.consume(code)).toBeNull();
  });

  it("rejects unknown codes", () => {
    const store = new OAuthExchangeStore();
    expect(store.consume("not-a-real-code")).toBeNull();
  });
});
