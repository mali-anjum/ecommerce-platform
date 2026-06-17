"use client";

import { useThemeStore } from "@/components/common/state/useThemeStore";
import { ThemeSegmentedControl } from "@/components/common/molecules/theme/ThemeSegmentedControl";

/** Compact theme control for the desktop header — single segmented track, no stacked overflow. */
export function ThemeToggleDesktop() {
  const { preference, isAnimating, setTheme, mounted } = useThemeStore();

  if (!mounted) {
    return (
      <div className="h-8 w-19 animate-pulse rounded-full bg-muted/50" />
    );
  }

  return (
    <ThemeSegmentedControl
      preference={preference}
      onSelect={setTheme}
      disabled={isAnimating}
      className="h-8 w-19 border border-border/50 bg-card/80"
    />
  );
}
