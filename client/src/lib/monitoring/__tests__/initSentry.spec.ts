import fs from "node:fs";
import path from "node:path";

const init = jest.fn();
const isInitialized = jest.fn();
const replayIntegration = jest.fn(() => ({ name: "Replay" }));

jest.mock("@sentry/nextjs", () => ({
  init: (...args: unknown[]) => init(...args),
  isInitialized: () => isInitialized(),
  replayIntegration: () => replayIntegration(),
}));

import { baseInitOptions, initSentryBrowser, initSentryServer } from "../initSentry";
import { getSentryDsn, isSentryEnabled } from "../sentryConfig";

const SENTRY_ENV_KEYS = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_DSN",
  "SENTRY_ENABLED",
  "NEXT_PUBLIC_SENTRY_ENABLED",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
  "SENTRY_TRACES_SAMPLE_RATE",
];

const originalEnv = { ...process.env };
const originalWindow = (globalThis as { window?: unknown }).window;

function setWindow(present: boolean) {
  if (present) {
    (globalThis as { window?: unknown }).window = {};
  } else {
    delete (globalThis as { window?: unknown }).window;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  isInitialized.mockReturnValue(false);
  for (const key of SENTRY_ENV_KEYS) delete process.env[key];
  setWindow(false);
});

afterAll(() => {
  process.env = originalEnv;
  (globalThis as { window?: unknown }).window = originalWindow;
});

describe("getSentryDsn", () => {
  it("is undefined when no DSN is configured", () => {
    expect(getSentryDsn()).toBeUndefined();
  });

  it("prefers NEXT_PUBLIC_SENTRY_DSN and trims it", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "  https://public@sentry.example/1  ";
    process.env.SENTRY_DSN = "https://server@sentry.example/2";
    expect(getSentryDsn()).toBe("https://public@sentry.example/1");
  });

  it("falls back to SENTRY_DSN when NEXT_PUBLIC_SENTRY_DSN is an empty string", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "";
    process.env.SENTRY_DSN = "https://server@sentry.example/2";
    expect(getSentryDsn()).toBe("https://server@sentry.example/2");
  });
});

describe("isSentryEnabled", () => {
  it("is off without a DSN even in production", () => {
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "production";
    process.env.SENTRY_ENABLED = "true";
    expect(isSentryEnabled()).toBe(false);
  });

  it.each([
    ["production", true],
    ["staging", true],
    ["development", false],
    ["test", false],
  ])("with a DSN in %s → %s", (environment, expected) => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = environment;
    expect(isSentryEnabled()).toBe(expected);
  });

  it("honours the browser-visible NEXT_PUBLIC_SENTRY_ENABLED override", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "development";
    process.env.NEXT_PUBLIC_SENTRY_ENABLED = "true";
    expect(isSentryEnabled()).toBe(true);
  });

  it("lets SENTRY_ENABLED=false switch production off", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "production";
    process.env.SENTRY_ENABLED = "false";
    expect(isSentryEnabled()).toBe(false);
  });
});

describe("baseInitOptions", () => {
  it("defaults tracing to 10% and reads the DSN from getSentryDsn", () => {
    process.env.SENTRY_DSN = "https://server@sentry.example/2";
    const options = baseInitOptions();
    expect(options.tracesSampleRate).toBe(0.1);
    expect(options.dsn).toBe("https://server@sentry.example/2");
    expect(typeof options.beforeSend).toBe("function");
  });

  it("ignores out-of-range sample rates", () => {
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "5";
    expect(baseInitOptions().tracesSampleRate).toBe(0.1);
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "0.2";
    expect(baseInitOptions().tracesSampleRate).toBe(0.2);
  });
});

describe("init entry points", () => {
  const enable = () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "production";
  };

  it("initSentryBrowser initialises once with replay, only in a browser", () => {
    enable();
    initSentryBrowser();
    expect(init).not.toHaveBeenCalled();

    setWindow(true);
    initSentryBrowser();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).toMatchObject({
      dsn: "https://public@sentry.example/1",
      replaysOnErrorSampleRate: 1.0,
      integrations: [{ name: "Replay" }],
    });

    isInitialized.mockReturnValue(true);
    initSentryBrowser();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("initSentryServer initialises without replay and skips when already initialised", () => {
    enable();
    initSentryServer();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).not.toHaveProperty("integrations");
    expect(replayIntegration).not.toHaveBeenCalled();

    isInitialized.mockReturnValue(true);
    initSentryServer();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("does nothing when Sentry is disabled", () => {
    setWindow(true);
    initSentryBrowser();
    initSentryServer();
    expect(init).not.toHaveBeenCalled();
  });
});

describe("single initialization source (issue #29)", () => {
  const clientRoot = path.resolve(__dirname, "../../../..");
  const allowedInitFile = path.join(clientRoot, "src/lib/monitoring/initSentry.ts");
  const skipDirs = new Set(["node_modules", ".next", "__tests__", "coverage", "public"]);

  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return skipDirs.has(entry.name) ? [] : sourceFiles(full);
      return /\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) ? [full] : [];
    });
  }

  const files = [
    ...sourceFiles(path.join(clientRoot, "src")),
    ...fs
      .readdirSync(clientRoot)
      .filter((name) => /\.(ts|js|mjs|cjs)$/.test(name))
      .map((name) => path.join(clientRoot, name)),
  ];

  it("calls Sentry.init only from initSentry.ts", () => {
    const offenders = files.filter(
      (file) => file !== allowedInitFile && /Sentry\.init\s*\(/.test(fs.readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });

  it("has no hardcoded Sentry DSN", () => {
    const offenders = files.filter((file) =>
      /https:\/\/[0-9a-f]+@[\w.-]*sentry\.io/.test(fs.readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });
});
