import "../src/db/load-env"; // must stay first: the db client reads DATABASE_URL on import

import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import type { PageKey } from "@/db/queries/meta";
import { localized } from "@/db/queries/localized";
import { metaPageTranslations, metaPages, metaSiteSettings, metaSiteSettingsTranslations } from "@/db/schema";
import type { Locale } from "@/shared/lib/locales";

/**
 * Read-only access to the `meta_` tables for the e2e suite: tests compare the page with the database instead of
 * hard-coding a title, a URL or the `hidden_from_search` flag, so editing them later does not break the suite.
 * Texts are read for the requested locale with the same per-field fallback to `en` as the site, so a translation
 * added later does not break it either. The database is the production one: this file only selects.
 */

export interface SiteMetaRow {
  siteName: string;
  defaultTitle: string;
  hiddenFromSearch: boolean;
  iconIcoUrl: string | null;
  iconSvgUrl: string | null;
  iconPngUrl: string | null;
  appleTouchIconUrl: string | null;
  ogPlaceholderUrl: string | null;
}

export interface PageMetaRow {
  title: string;
  description: string;
  ogImageUrl: string | null;
}

export const readSiteMeta = async (locale: Locale = "en"): Promise<SiteMetaRow> => {
  const tr = alias(metaSiteSettingsTranslations, "tr");
  const en = alias(metaSiteSettingsTranslations, "en");

  const [row] = await db
    .select({
      siteName: localized(tr.siteName, en.siteName),
      defaultTitle: localized(tr.defaultTitle, en.defaultTitle),
      hiddenFromSearch: metaSiteSettings.hiddenFromSearch,
      iconIcoUrl: metaSiteSettings.iconIcoUrl,
      iconSvgUrl: metaSiteSettings.iconSvgUrl,
      iconPngUrl: metaSiteSettings.iconPngUrl,
      appleTouchIconUrl: metaSiteSettings.appleTouchIconUrl,
      ogPlaceholderUrl: metaSiteSettings.ogPlaceholderUrl,
    })
    .from(metaSiteSettings)
    .innerJoin(en, and(eq(en.settingsId, metaSiteSettings.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.settingsId, metaSiteSettings.id), eq(tr.locale, locale)));
  if (!row) throw new Error("Site metadata is missing.");

  return row;
};

export const readPageMeta = async (key: PageKey, locale: Locale = "en"): Promise<PageMetaRow> => {
  const tr = alias(metaPageTranslations, "tr");
  const en = alias(metaPageTranslations, "en");

  const [row] = await db
    .select({
      title: localized(tr.title, en.title),
      description: localized(tr.description, en.description),
      ogImageUrl: metaPages.ogImageUrl,
    })
    .from(metaPages)
    .innerJoin(en, and(eq(en.pageId, metaPages.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.pageId, metaPages.id), eq(tr.locale, locale)))
    .where(eq(metaPages.key, key));
  if (!row) throw new Error(`Metadata of page "${key}" is missing.`);

  return row;
};
