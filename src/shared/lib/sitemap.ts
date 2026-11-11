import type { MetadataRoute } from "next";

import { getLocaleAlternates } from "@/shared/lib/i18n/alternates";
import { locales } from "@/shared/lib/locales";

export const sitePaths = ["", "/about", "/experience", "/skills"] as const;

export const buildSitemap = (base: URL): MetadataRoute.Sitemap =>
  sitePaths.flatMap((path) =>
    locales.map((locale) => {
      const { canonical, languages } = getLocaleAlternates(locale, path);
      const absolute = (relative: string) => new URL(relative, base).href;

      return {
        url: absolute(canonical),
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([key, value]) => [key, absolute(value)])),
        },
      };
    }),
  );
