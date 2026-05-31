import type { ResolvedTheme, ThemePreference } from "./types";

export function getSystemResolvedTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return getSystemResolvedTheme();
  return preference;
}

export function applyThemeToDocument(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function getThemeLabel(preference: ThemePreference): string {
  switch (preference) {
    case "light":
      return "Light Mode";
    case "dark":
      return "Dark Mode";
    case "system":
      return "Auto Mode";
    default:
      return "Theme";
  }
}

export function getThemeHelper(preference: ThemePreference): string {
  switch (preference) {
    case "light":
      return "Bright interface";
    case "dark":
      return "Dark interface";
    case "system":
      return "Matches your device";
    default:
      return "Click to switch theme";
  }
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
