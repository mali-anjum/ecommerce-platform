import { getServerBackendUrl } from "../getServerBackendUrl";

describe("getServerBackendUrl", () => {
  const env = process.env as Record<string, string | undefined>;
  let snapshot: {
    NODE_ENV: string | undefined;
    BACKEND_URL: string | undefined;
    DEVE_URL: string | undefined;
    DEV_URL: string | undefined;
  };

  beforeEach(() => {
    snapshot = {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL,
      DEVE_URL: process.env.DEVE_URL,
      DEV_URL: process.env.DEV_URL,
    };
  });

  afterEach(() => {
    for (const key of ["NODE_ENV", "BACKEND_URL", "DEVE_URL", "DEV_URL"] as const) {
      const v = snapshot[key];
      if (v === undefined) {
        delete env[key];
      } else {
        env[key] = v;
      }
    }
  });

  it("uses BACKEND_URL in production", () => {
    env.NODE_ENV = "production";
    process.env.BACKEND_URL = "https://api.example.com";
    delete process.env.DEVE_URL;
    delete process.env.DEV_URL;
    expect(getServerBackendUrl()).toBe("https://api.example.com");
  });

  it("prefers DEV_URL over DEVE_URL in development", () => {
    env.NODE_ENV = "development";
    process.env.DEVE_URL = "http://legacy:4001";
    process.env.DEV_URL = "http://localhost:4001";
    process.env.BACKEND_URL = "https://remote.example.com";
    expect(getServerBackendUrl()).toBe("http://localhost:4001");
  });

  it("falls back to DEVE_URL then BACKEND_URL when DEV_URL is unset", () => {
    env.NODE_ENV = "development";
    delete process.env.DEV_URL;
    process.env.DEVE_URL = "http://local-dev:4001";
    process.env.BACKEND_URL = "https://remote.example.com";
    expect(getServerBackendUrl()).toBe("http://local-dev:4001");
  });

  it("falls back to BACKEND_URL when neither DEV_URL nor DEVE_URL are set", () => {
    env.NODE_ENV = "development";
    delete process.env.DEV_URL;
    delete process.env.DEVE_URL;
    process.env.BACKEND_URL = "https://remote.example.com";
    expect(getServerBackendUrl()).toBe("https://remote.example.com");
  });
});
