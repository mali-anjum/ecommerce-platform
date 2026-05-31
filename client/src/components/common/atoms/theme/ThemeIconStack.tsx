"use client";

import { Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/components/common/utils/theme/types";

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_ICON_COLORS = {
  light: "text-primary",
  dark: "text-secondary",
  system: "text-accent",
} as const;

const THEME_GLOW_CLASSES = {
  light: "bg-primary/20",
  dark: "bg-secondary/20",
  system: "bg-accent/20",
} as const;

type ThemeIconStackProps = {
  preference: ThemePreference;
  isAnimating?: boolean;
  size?: "sm" | "md";
};

/** Crossfades sun / moon / monitor icons when the theme changes. */
export function ThemeIconStack({
  preference,
  isAnimating = false,
  size = "md",
}: ThemeIconStackProps) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const boxClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={cn("relative", boxClass)}>
      {(Object.keys(THEME_ICONS) as ThemePreference[]).map((t) => {
        const Icon = THEME_ICONS[t];
        const isActive = preference === t;
        return (
          <span
            key={t}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-theme-smooth",
              isActive
                ? "scale-100 opacity-100 rotate-0"
                : "pointer-events-none scale-75 opacity-0 rotate-12"
            )}
          >
            <Icon className={cn(iconClass, THEME_ICON_COLORS[t])} />
          </span>
        );
      })}
      {isAnimating && (
        <span className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <Sparkles className={cn(iconClass, "animate-spin-slow text-accent")} />
        </span>
      )}
      <span
        className={cn(
          "absolute -inset-1 rounded-full blur-sm transition-opacity duration-500 ease-theme-smooth",
          THEME_GLOW_CLASSES[preference]
        )}
      />
    </div>
  );
}
