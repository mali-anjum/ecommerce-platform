import {
  applyThemeToDocument,
  getThemeHelper,
  getThemeLabel,
  isThemePreference,
  resolveTheme,
} from "../theme/theme-utils";
import type { ThemePreference } from "../theme/types";

describe("theme-utils", () => {
  const setAttribute = jest.fn();
  let prefersDark = false;

  beforeEach(() => {
    setAttribute.mockReset();
    Object.assign(globalThis, {
      window: { matchMedia: () => ({ matches: prefersDark }) },
      document: { documentElement: { setAttribute } },
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  });

  it("resolves explicit and system preferences", () => {
    expect(resolveTheme("dark")).toBe("dark");
    prefersDark = false;
    expect(resolveTheme("system")).toBe("light");
    prefersDark = true;
    expect(resolveTheme("system")).toBe("dark");
  });

  it("applies the resolved theme to <html data-theme>", () => {
    prefersDark = true;
    expect(applyThemeToDocument("system")).toBe("dark");
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
  });

  it("labels each preference with a fallback", () => {
    expect(getThemeLabel("light")).toBe("Light Mode");
    expect(getThemeLabel("system")).toBe("Auto Mode");
    expect(getThemeLabel("other" as ThemePreference)).toBe("Theme");
    expect(getThemeHelper("dark")).toBe("Dark interface");
    expect(getThemeHelper("other" as ThemePreference)).toBe("Click to switch theme");
  });

  it("validates stored preferences", () => {
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("blue")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
