"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { FC, ReactNode } from "react";

import { ThemeColorSync } from "./ThemeColorSync";

interface ThemeProviderProps {
  children: ReactNode;
}

const scriptProps = typeof window === "undefined" ? undefined : { type: "application/json" };

export const ThemeProvider: FC<ThemeProviderProps> = (props) => {
  const { children } = props;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
};
