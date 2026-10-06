const init = jest.fn();

jest.mock("@sentry/node", () => ({
  init: (...args: unknown[]) => init(...args),
  httpIntegration: () => ({ name: "Http" }),
  expressIntegration: () => ({ name: "Express" }),
}));
jest.mock("../sentryTracker", () => ({ sentryTracker: jest.fn() }));

import { sentryTracker } from "../sentryTracker";

const originalEnv = { ...process.env };

async function loadInit() {
  jest.resetModules();
  return import("../sentryInit");
}

describe("initSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    process.env = { ...originalEnv };
    delete process.env.SENTRY_ENABLED;
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("does not initialise without a DSN", async () => {
    delete process.env.SENTRY_DSN;
    process.env.SENTRY_ENVIRONMENT = "production";
    const { initSentry } = await loadInit();
    initSentry();
    expect(init).not.toHaveBeenCalled();
  });

  it("initialises exactly once with a 10% default trace rate and scrubbing", async () => {
    process.env.SENTRY_DSN = "https://key@sentry.example/1";
    process.env.SENTRY_ENVIRONMENT = "production";
    const { initSentry } = await loadInit();
    initSentry();
    initSentry();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).toMatchObject({
      dsn: "https://key@sentry.example/1",
      environment: "production",
      tracesSampleRate: 0.1,
    });
    expect(typeof init.mock.calls[0][0].beforeSend).toBe("function");
  });
});

describe("registerProcessErrorHandlers", () => {
  let added: string[];

  beforeEach(() => {
    added = [];
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    for (const event of added) {
      const listeners = process.listeners(event as NodeJS.Signals);
      process.removeListener(event as NodeJS.Signals, listeners[listeners.length - 1]);
    }
    jest.restoreAllMocks();
  });

  function trackAdded(fn: () => void) {
    const before = {
      unhandledRejection: process.listenerCount("unhandledRejection"),
      uncaughtException: process.listenerCount("uncaughtException"),
    };
    fn();
    for (const event of ["unhandledRejection", "uncaughtException"] as const) {
      const diff = process.listenerCount(event) - before[event];
      for (let i = 0; i < diff; i++) added.push(event);
    }
    return {
      unhandledRejection: process.listenerCount("unhandledRejection") - before.unhandledRejection,
      uncaughtException: process.listenerCount("uncaughtException") - before.uncaughtException,
    };
  }

  it("never registers an uncaughtException listener (that would keep a broken process alive)", async () => {
    const { registerProcessErrorHandlers } = await loadInit();
    const delta = trackAdded(registerProcessErrorHandlers);
    expect(delta.uncaughtException).toBe(0);
    expect(delta.unhandledRejection).toBe(1);
  });

  it("logs unhandled rejections without sending a duplicate Sentry event", async () => {
    const { registerProcessErrorHandlers } = await loadInit();
    trackAdded(registerProcessErrorHandlers);
    const listeners = process.listeners("unhandledRejection");
    const handler = listeners[listeners.length - 1] as (reason: unknown) => void;

    handler(new Error("lost promise"));

    expect(console.error).toHaveBeenCalledWith(
      "[process] Unhandled promise rejection:",
      expect.stringContaining("lost promise")
    );
    expect(sentryTracker).not.toHaveBeenCalled();
  });
});
