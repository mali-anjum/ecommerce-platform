"use client";

import { cn } from "@/lib/utils";
import { getThemeHelper, getThemeLabel } from "@/lib/theme/theme-utils";
import { useThemeStore } from "@/store/useThemeStore";
import { ThemeIconStack } from "@/components/common/atoms/theme/ThemeIconStack";
import { ThemeSegmentedControl } from "@/components/common/molecules/theme/ThemeSegmentedControl";

/** Profile dropdown row — same theme control as the header, account-menu layout. */
export function ThemeMenuRow() {
  const { preference, isAnimating, cycleTheme, setTheme, mounted } = useThemeStore();

  if (!mounted) {
    return (
      <div className="mx-1 my-1 h-[52px] animate-pulse rounded-lg bg-muted/30 px-3" />
    );
  }

  const label = getThemeLabel(preference);
  const helper = getThemeHelper(preference);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}. ${helper}`}
      onClick={() => cycleTheme()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycleTheme();
        }
      }}
      className={cn(
        "mx-1 my-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5",
        "transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isAnimating && "pointer-events-none opacity-90"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <ThemeIconStack preference={preference} isAnimating={isAnimating} size="sm" />
        </span>
        <div className="flex min-w-0 flex-col text-left">
          <span
            key={`theme-label-${preference}`}
            className="text-sm font-medium text-foreground animate-in fade-in slide-in-from-left-1 duration-300"
          >
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{helper}</span>
        </div>
      </div>

      <ThemeSegmentedControl
        preference={preference}
        onSelect={setTheme}
        disabled={isAnimating}
      />
    </div>
  );
}
