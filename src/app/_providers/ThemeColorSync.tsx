"use client";

import { useTheme } from "next-themes";
import { type FC, useEffect } from "react";

import { themeColors } from "@/shared/lib/theme-colors";

const applyColor = (color: string) => {
  for (const tag of document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (tag.content !== color) tag.content = color;
  }
};

export const ThemeColorSync: FC = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;

    const color = themeColors[resolvedTheme];
    applyColor(color);

    const observer = new MutationObserver(() => applyColor(color));
    observer.observe(document.head, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  return null;
};
