"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/components/common/state/useThemeStore";
import { getThemeLabel } from "@/components/common/utils/theme/theme-utils";
import { ThemeIconStack } from "@/components/common/atoms/theme/ThemeIconStack";
import { ThemeSegmentedControl } from "@/components/common/molecules/theme/ThemeSegmentedControl";

const ThemeGlowEffect = ({
  isHovered,
  preference,
}: {
  isHovered: boolean;
  preference: "light" | "dark" | "system";
}) => {
  const gradientColors = {
    light: "from-primary/20 via-secondary/10 to-accent/10",
    dark: "from-secondary/20 via-primary/10 to-accent/10",
    system: "from-accent/20 via-primary/10 to-secondary/10",
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500 ease-theme-smooth",
        isHovered ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-r opacity-80",
          isHovered && "animate-pulse",
          gradientColors[preference]
        )}
      />
    </div>
  );
};

/** Circular theme button in the desktop header (xl breakpoint). */
export function ThemeToggleDesktop() {
  const { preference, isAnimating, cycleTheme, setTheme, mounted } = useThemeStore();
  const [isHovered, setIsHovered] = useState(false);

  if (!mounted) {
    return (
      <div className="h-12 w-12 animate-pulse rounded-full glass-effect border-glass-border" />
    );
  }

  const label = getThemeLabel(preference);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => cycleTheme()}
        disabled={isAnimating}
        className={cn(
          "relative h-12 w-12 rounded-full glass-effect border-glass-border transition-transform duration-500 ease-theme-smooth hover:border-primary/50",
          isAnimating ? "scale-95" : "hover:scale-105"
        )}
        aria-label={`Theme: ${label}. Click to cycle.`}
      >
        <ThemeGlowEffect isHovered={isHovered} preference={preference} />
        <div className="relative z-10 flex h-full items-center justify-center">
          <ThemeIconStack preference={preference} isAnimating={isAnimating} />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors duration-500 ease-theme-smooth",
              preference === "light" && "bg-primary",
              preference === "dark" && "bg-secondary",
              preference === "system" && "bg-accent",
              isAnimating && "animate-pulse"
            )}
          />
        </div>
      </button>

      <div className="mt-3">
        <ThemeSegmentedControl
          preference={preference}
          onSelect={setTheme}
          disabled={isAnimating}
        />
      </div>
    </div>
  );
}
