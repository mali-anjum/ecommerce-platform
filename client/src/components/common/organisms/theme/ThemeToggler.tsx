"use client";

import { ThemeMenuRow } from "@/components/common/molecules/theme/ThemeMenuRow";
import { ThemeToggleDesktop } from "@/components/common/molecules/theme/ThemeToggleDesktop";

export type ThemeToggleProps = {
  /** `menu` = profile dropdown row; `default` = header circular control + track */
  variant?: "default" | "menu";
};

/**
 * Theme switcher — uses shared `useThemeStore` so header and menu stay in sync.
 */
export default function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  if (variant === "menu") {
    return <ThemeMenuRow />;
  }
  return <ThemeToggleDesktop />;
}
