import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/shared/lib/locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});
