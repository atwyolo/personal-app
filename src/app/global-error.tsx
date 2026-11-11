"use client";

import type { FC } from "react";

import { ErrorContent } from "@/views/error/ErrorContent";
import { errorTexts, getErrorLocale } from "@/views/error/error-texts";
import { readTheme } from "@/views/error/read-theme";

import { fontVariables } from "./fonts";

import "./globals.css";

interface GlobalErrorProps {
  error: unknown;
}

const GlobalError: FC<GlobalErrorProps> = (props) => {
  const { error } = props;
  const inBrowser = typeof window !== "undefined";
  const locale = inBrowser ? getErrorLocale(window.location.pathname) : "en";
  const theme = inBrowser ? readTheme() : "dark";

  return (
    <html lang={locale} className={`${fontVariables} ${theme} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ErrorContent error={error} texts={errorTexts[locale]} />
      </body>
    </html>
  );
};

export default GlobalError;
