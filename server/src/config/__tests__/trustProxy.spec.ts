import { resolveTrustProxyHops } from "../trustProxy";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("resolveTrustProxyHops", () => {
  it("defaults to one hop in production and none locally", () => {
    expect(resolveTrustProxyHops(env({ NODE_ENV: "production" }))).toBe(1);
    expect(resolveTrustProxyHops(env({ NODE_ENV: "development" }))).toBe(0);
    expect(resolveTrustProxyHops(env({}))).toBe(0);
  });

  it("uses TRUST_PROXY when set", () => {
    expect(resolveTrustProxyHops(env({ NODE_ENV: "production", TRUST_PROXY: "2" }))).toBe(2);
    expect(resolveTrustProxyHops(env({ NODE_ENV: "production", TRUST_PROXY: "0" }))).toBe(0);
    expect(resolveTrustProxyHops(env({ TRUST_PROXY: " 1 " }))).toBe(1);
  });

  it.each(["-1", "1.5", "true", "abc"])("fails fast on invalid TRUST_PROXY %p", (value) => {
    expect(() => resolveTrustProxyHops(env({ TRUST_PROXY: value }))).toThrow("TRUST_PROXY must be a non-negative integer");
  });
});
