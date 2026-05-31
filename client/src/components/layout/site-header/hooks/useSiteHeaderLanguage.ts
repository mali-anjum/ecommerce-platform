"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SITE_HEADER_LOCALE,
  getLanguageByLocale,
  getStoredSiteHeaderLocale,
  persistSiteHeaderLocale,
  type SiteHeaderLanguageLabel,
  type SiteHeaderLocale,
} from "@/components/layout/site-header/config/site-header-languages";

export function useSiteHeaderLanguage() {
  const [locale, setLocale] = useState<SiteHeaderLocale>(
    DEFAULT_SITE_HEADER_LOCALE,
  );

  useEffect(() => {
    const saved = getStoredSiteHeaderLocale();
    if (saved) {
      setLocale(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const selectLanguage = useCallback((value: SiteHeaderLocale) => {
    setLocale(value);
    persistSiteHeaderLocale(value);
  }, []);

  const selectedLanguage: SiteHeaderLanguageLabel =
    getLanguageByLocale(locale).label;

  return { selectedLanguage, selectedLocale: locale, selectLanguage };
}
