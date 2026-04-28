import { runWithRefreshLock } from "../runWithRefreshLock";

describe("runWithRefreshLock", () => {
  beforeEach(() => {
    if (!globalThis.navigator) {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    delete (globalThis.navigator as unknown as { locks?: unknown }).locks;
  });

  it("runs fn directly when locks API is missing", async () => {
    const fn = jest.fn().mockResolvedValue(42);
    await expect(runWithRefreshLock(fn)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("delegates to navigator.locks.request when present", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const request = jest.fn((_name: string, _opts: unknown, cb: () => Promise<string>) =>
      cb()
    );
    (
      globalThis.navigator as unknown as {
        locks: { request: typeof request };
      }
    ).locks = { request };

    await expect(runWithRefreshLock(fn)).resolves.toBe("ok");
    expect(request).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
