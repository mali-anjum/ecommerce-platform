"use client";

import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/components/common/utils/theme/types";
import { THEME_PREFERENCES } from "@/components/common/utils/theme/types";

const SEGMENT_LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
};

const INDICATOR_LEFT: Record<ThemePreference, string> = {
  light: "0.125rem",
  dark: "calc(50% - 0.625rem)",
  system: "calc(100% - 1.375rem)",
};

const INDICATOR_GLOW: Record<ThemePreference, string> = {
  light: "shadow-[0_0_8px_hsl(var(--primary)/0.55)] bg-primary",
  dark: "shadow-[0_0_8px_hsl(var(--secondary)/0.55)] bg-secondary",
  system: "shadow-[0_0_8px_hsl(var(--accent)/0.55)] bg-accent",
};

type ThemeSegmentedControlProps = {
  preference: ThemePreference;
  onSelect: (preference: ThemePreference) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Three-position theme track (light / dark / auto) — shared by header and profile menu.
 */
export function ThemeSegmentedControl({
  preference,
  onSelect,
  disabled = false,
  className,
}: ThemeSegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "relative flex h-7 w-19 shrink-0 items-center rounded-full bg-muted/50 px-0.5",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 h-4 w-5 -translate-y-1/2 rounded-full transition-[left,background-color,box-shadow] duration-500 ease-theme-smooth",
          INDICATOR_GLOW[preference]
        )}
        style={{ left: INDICATOR_LEFT[preference] }}
      />

      {THEME_PREFERENCES.map((t) => (
        <button
          key={t}
          type="button"
          disabled={disabled}
          aria-label={`${SEGMENT_LABELS[t]} theme`}
          aria-pressed={preference === t}
          title={SEGMENT_LABELS[t]}
          onClick={() => onSelect(t)}
          className={cn(
            "relative z-10 flex h-full flex-1 items-center justify-center rounded-full",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <span
            className={cn(
              "rounded-full transition-all duration-500 ease-theme-smooth",
              preference === t
                ? "h-0 w-0 opacity-0"
                : "h-1 w-1 bg-muted-foreground/45"
            )}
          />
        </button>
      ))}
    </div>
  );
}
