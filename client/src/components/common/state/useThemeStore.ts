"use client";

import { create } from "zustand";
import {
  applyThemeToDocument,
  isThemePreference,
} from "@/components/common/utils/theme/theme-utils";
import type { ResolvedTheme, ThemePreference } from "@/components/common/utils/theme/types";
import { THEME_PREFERENCES } from "@/components/common/utils/theme/types";

const THEME_TRANSITION_MS = 400;

interface ThemeStore {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  mounted: boolean;
  isAnimating: boolean;
  init: () => void;
  setTheme: (preference: ThemePreference) => void;
  cycleTheme: () => void;
}

let systemListenerAttached = false;

function attachSystemThemeListener() {
  if (systemListenerAttached || typeof window === "undefined") return;
  systemListenerAttached = true;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    const { preference, setTheme } = useThemeStore.getState();
    if (preference !== "system") return;
    setTheme("system");
  };

  mediaQuery.addEventListener("change", handleChange);
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  preference: "system",
  resolved: "dark",
  mounted: false,
  isAnimating: false,

  init: () => {
    if (typeof window === "undefined" || get().mounted) return;

    document.documentElement.classList.add("theme-transition");

    const stored = localStorage.getItem("theme");
    const preference: ThemePreference = isThemePreference(stored) ? stored : "system";
    const resolved = applyThemeToDocument(preference);

    if (preference === "system" && !stored) {
      localStorage.setItem("theme", "system");
    }

    attachSystemThemeListener();

    set({ preference, resolved, mounted: true });
  },

  setTheme: (preference) => {
    const { isAnimating, preference: current } = get();
    if (isAnimating) return;
    if (preference === current && preference !== "system") return;

    set({ isAnimating: true });
    const resolved = applyThemeToDocument(preference);
    localStorage.setItem("theme", preference);

    set({ preference, resolved });

    window.setTimeout(() => { 
      set({ isAnimating: false });
    }, THEME_TRANSITION_MS);
  },

  cycleTheme: () => {
    const { preference, setTheme } = get();
    const index = THEME_PREFERENCES.indexOf(preference);
    const next = THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
    setTheme(next);
  },
}));
