const storage = new Map<string, string>();
const setAttribute = jest.fn();
const addClass = jest.fn();
let changeListener: (() => void) | null = null;
let prefersDark = true;

Object.assign(globalThis, {
  window: {
    matchMedia: () => ({ matches: prefersDark, addEventListener: (_: string, fn: () => void) => (changeListener = fn) }),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
  },
  document: { documentElement: { setAttribute, classList: { add: addClass } } },
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
  },
});

import { useThemeStore } from "../useThemeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    storage.clear();
    setAttribute.mockClear();
    prefersDark = true;
    useThemeStore.setState({ preference: "system", resolved: "dark", mounted: false, isAnimating: false });
  });

  afterEach(() => jest.useRealTimers());

  afterAll(() => {
    for (const key of ["window", "document", "localStorage"]) Reflect.deleteProperty(globalThis, key);
  });

  it("initializes from storage, falling back to system for invalid values", () => {
    storage.set("theme", "neon");
    useThemeStore.getState().init();
    expect(useThemeStore.getState()).toMatchObject({ preference: "system", resolved: "dark", mounted: true });

    useThemeStore.setState({ mounted: false });
    storage.set("theme", "light");
    useThemeStore.getState().init();
    expect(useThemeStore.getState()).toMatchObject({ preference: "light", resolved: "light" });
    expect(setAttribute).toHaveBeenLastCalledWith("data-theme", "light");
  });

  it("persists choices and blocks changes during the transition", () => {
    useThemeStore.getState().setTheme("light");
    expect(storage.get("theme")).toBe("light");
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().preference).toBe("light");

    jest.advanceTimersByTime(400);
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().preference).toBe("dark");
  });

  it("cycles light → dark → system", () => {
    useThemeStore.setState({ preference: "light" });
    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().preference).toBe("dark");
    jest.advanceTimersByTime(400);
    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().preference).toBe("system");
  });

  it("follows OS changes only while on system", () => {
    useThemeStore.getState().init();
    prefersDark = false;
    changeListener?.();
    expect(useThemeStore.getState().resolved).toBe("light");

    jest.advanceTimersByTime(400);
    useThemeStore.getState().setTheme("dark");
    jest.advanceTimersByTime(400);
    prefersDark = false;
    changeListener?.();
    expect(useThemeStore.getState().resolved).toBe("dark");
  });
});
