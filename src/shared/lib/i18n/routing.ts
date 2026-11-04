import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/shared/lib/locales";

/**
 * Locale routing for next-intl, shared by the proxy, navigation helpers and request config.
 * Locales come from the shared list in `src/shared/lib/locales.ts`.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every locale has a URL prefix, the default too (/en/...): see docs/architecture/Localization.md.
  localePrefix: "always",
  // A path without a locale (e.g. "/") is redirected by the NEXT_LOCALE cookie, then Accept-Language, then `en`.
  localeDetection: true,
  // The cookie is set only when the visitor picks a locale that differs from Accept-Language; keep it for a year.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});
