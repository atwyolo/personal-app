import "server-only";

import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { metaPageTranslations, metaPages, metaSiteSettings, metaSiteSettingsTranslations } from "@/db/schema";
import type { Locale } from "@/shared/lib/locales";
import { localized } from "./localized";

/**
 * Metadata from the `meta_` tables, cached as the page data is: the result joins the static shell at build time,
 * and the admin refreshes every page with `updateTag(metaCacheTags.meta)`. The locale is part of the cache key.
 * A missing row throws, so the build fails loudly instead of shipping a page with a generic title.
 */
export const metaCacheTags = {
  meta: "meta",
} as const;

/** Every fixed page with a row in `meta_pages`. A new page adds its key here and its row in the seed. */
export type PageKey = "home" | "about" | "projects" | "skills";

export type SiteMeta = {
  siteName: string;
  defaultTitle: string;
  iconIcoUrl: string | null;
  iconSvgUrl: string | null;
  iconPngUrl: string | null;
  appleTouchIconUrl: string | null;
  ogPlaceholderUrl: string | null;
  hiddenFromSearch: boolean;
};

export type PageMeta = {
  title: string;
  description: string;
  ogImageUrl: string | null;
};

export async function getSiteMeta(locale: Locale): Promise<SiteMeta> {
  "use cache";
  cacheLife("max");
  cacheTag(metaCacheTags.meta);

  const tr = alias(metaSiteSettingsTranslations, "tr");
  const en = alias(metaSiteSettingsTranslations, "en");

  const rows = await db
    .select({
      siteName: localized(tr.siteName, en.siteName),
      defaultTitle: localized(tr.defaultTitle, en.defaultTitle),
      iconIcoUrl: metaSiteSettings.iconIcoUrl,
      iconSvgUrl: metaSiteSettings.iconSvgUrl,
      iconPngUrl: metaSiteSettings.iconPngUrl,
      appleTouchIconUrl: metaSiteSettings.appleTouchIconUrl,
      ogPlaceholderUrl: metaSiteSettings.ogPlaceholderUrl,
      hiddenFromSearch: metaSiteSettings.hiddenFromSearch,
    })
    .from(metaSiteSettings)
    .innerJoin(en, and(eq(en.settingsId, metaSiteSettings.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.settingsId, metaSiteSettings.id), eq(tr.locale, locale)))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error("Site metadata is missing. Run `npm run db:seed`.");

  return row;
}

export async function getPageMeta(locale: Locale, key: PageKey): Promise<PageMeta> {
  "use cache";
  cacheLife("max");
  cacheTag(metaCacheTags.meta);

  const tr = alias(metaPageTranslations, "tr");
  const en = alias(metaPageTranslations, "en");

  const rows = await db
    .select({
      title: localized(tr.title, en.title),
      description: localized(tr.description, en.description),
      ogImageUrl: metaPages.ogImageUrl,
    })
    .from(metaPages)
    .innerJoin(en, and(eq(en.pageId, metaPages.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.pageId, metaPages.id), eq(tr.locale, locale)))
    .where(eq(metaPages.key, key))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error(`Metadata of page "${key}" is missing. Run \`npm run db:seed\`.`);

  return row;
}
