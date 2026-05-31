export const SITE_HEADER_LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
] as const;

export type SiteHeaderLocale =
  (typeof SITE_HEADER_LANGUAGE_OPTIONS)[number]["value"];

export type SiteHeaderLanguageLabel =
  (typeof SITE_HEADER_LANGUAGE_OPTIONS)[number]["label"];

export type SiteHeaderLanguageOption =
  (typeof SITE_HEADER_LANGUAGE_OPTIONS)[number];

export const DEFAULT_SITE_HEADER_LOCALE: SiteHeaderLocale = "en";

const PREFERRED_LANGUAGE_STORAGE_KEY = "preferred-language";

const localeSet = new Set<string>(
  SITE_HEADER_LANGUAGE_OPTIONS.map((option) => option.value),
);

export function isSiteHeaderLocale(value: string): value is SiteHeaderLocale {
  return localeSet.has(value);
}

export function getLanguageByLocale(
  locale: SiteHeaderLocale,
): SiteHeaderLanguageOption {
  const option = SITE_HEADER_LANGUAGE_OPTIONS.find(
    (entry) => entry.value === locale,
  );
  if (!option) {
    throw new Error(`Unknown site header locale: ${locale}`);
  }
  return option;
}

export function getStoredSiteHeaderLocale(): SiteHeaderLocale | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(PREFERRED_LANGUAGE_STORAGE_KEY);
  if (!saved || !isSiteHeaderLocale(saved)) return null;
  return saved;
}

export function persistSiteHeaderLocale(locale: SiteHeaderLocale): void {
  localStorage.setItem(PREFERRED_LANGUAGE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}
