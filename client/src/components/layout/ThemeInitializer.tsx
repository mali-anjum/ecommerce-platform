"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/components/common/state/useThemeStore";

/** Applies saved theme before paint and wires system preference listener. */
export default function ThemeInitializer() {
  const init = useThemeStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return null;
}
