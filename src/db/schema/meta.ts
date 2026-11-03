import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { id, localeEnum, timestamps, translationOf } from "./common";

/**
 * Site-wide metadata. Singleton: the check constraint guarantees there is never a second row.
 * Every URL is a Vercel Blob file and may be empty: the layout then emits an empty icon (`data:,`)
 * and pages without their own image get no preview image.
 */
export const metaSiteSettings = pgTable(
  "meta_site_settings",
  {
    id: integer().primaryKey().default(1),
    /** `favicon.ico` holding 16, 32 and 48 px. `/favicon.ico` redirects to it. */
    iconIcoUrl: text(),
    /** Vector icon for current browsers. */
    iconSvgUrl: text(),
    /** 96 × 96 PNG for browsers without SVG icons; a multiple of 48, as Google Search asks. */
    iconPngUrl: text(),
    /** 180 × 180: "Add to Home Screen" and bookmarks on iOS. */
    appleTouchIconUrl: text(),
    /** 1200 × 630: the link preview image of a page without its own. */
    ogPlaceholderUrl: text(),
    /** `true` adds `noindex, nofollow` to every page. Defaults to closed: a forgotten seed keeps the site out of search. */
    hiddenFromSearch: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    check("meta_site_settings_singleton", sql`${t.id} = 1`),
    // An empty or relative URL would skip the fallbacks or break `Response.redirect` at build time: absolute or null.
    check(
      "meta_site_settings_urls_absolute",
      sql`(${t.iconIcoUrl} is null or ${t.iconIcoUrl} ~ '^https://') and (${t.iconSvgUrl} is null or ${t.iconSvgUrl} ~ '^https://') and (${t.iconPngUrl} is null or ${t.iconPngUrl} ~ '^https://') and (${t.appleTouchIconUrl} is null or ${t.appleTouchIconUrl} ~ '^https://') and (${t.ogPlaceholderUrl} is null or ${t.ogPlaceholderUrl} ~ '^https://')`,
    ),
  ],
);

export const metaSiteSettingsTranslations = pgTable(
  "meta_site_settings_translations",
  {
    // Not `translationOf`: its generated key name has 68 characters, Postgres cuts names to 63, and drizzle-kit then
    // sees a changed key on every push. The key is declared below with a name that fits.
    settingsId: integer().notNull(),
    locale: localeEnum().notNull(),
    /** `og:site_name`. */
    siteName: text(),
    /** The title of any page that sets none, e.g. the 404 page. */
    defaultTitle: text(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.settingsId, t.locale] }),
    foreignKey({
      name: "meta_site_settings_translations_settings_id_fk",
      columns: [t.settingsId],
      foreignColumns: [metaSiteSettings.id],
    }).onDelete("cascade"),
    check(
      "meta_site_settings_translations_en_complete",
      sql`${t.locale} <> 'en' or (${t.siteName} is not null and ${t.defaultTitle} is not null)`,
    ),
    // Null means "fall back to en"; an empty string would show an empty name or title instead.
    check(
      "meta_site_settings_translations_not_blank",
      sql`btrim(${t.siteName}) <> '' and btrim(${t.defaultTitle}) <> ''`,
    ),
  ],
);

/** Metadata of a fixed page. A page reads its row by `key`; a missing row fails the build. */
export const metaPages = pgTable(
  "meta_pages",
  {
    id: id(),
    /** `home`, `about`, `projects`, ...: the code names them in the `PageKey` type. Text, not an enum: a new page adds a row. */
    key: text().notNull().unique(),
    /** Link preview image; null falls back to `meta_site_settings.og_placeholder_url`. */
    ogImageUrl: text(),
    ...timestamps,
  },
  (t) => [check("meta_pages_og_image_url_absolute", sql`${t.ogImageUrl} is null or ${t.ogImageUrl} ~ '^https://'`)],
);

export const metaPageTranslations = pgTable(
  "meta_page_translations",
  {
    pageId: translationOf(() => metaPages.id),
    locale: localeEnum().notNull(),
    /** The full `<title>` and `og:title`, shown exactly as stored. */
    title: text(),
    /** `<meta name="description">` and `og:description`, about 160 characters (validated in the admin). */
    description: text(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.locale] }),
    check(
      "meta_page_translations_en_complete",
      sql`${t.locale} <> 'en' or (${t.title} is not null and ${t.description} is not null)`,
    ),
    check("meta_page_translations_not_blank", sql`btrim(${t.title}) <> '' and btrim(${t.description}) <> ''`),
  ],
);
