import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { RichTextDoc } from "@/shared/lib/rich-text";
import { localeEnum, timestamps, translationOf } from "./common";

/** Singleton: the check constraint guarantees there is never a second row. */
export const profile = pgTable(
  "profile",
  {
    id: integer().primaryKey().default(1),
    /** Vercel Blob URL. Alt text is the translated name. */
    photoUrl: text(),
    /** E.164, e.g. +37493310039. Display format and wa.me link are derived. */
    whatsappPhone: text().notNull(),
    email: text().notNull(),
    linkedinUrl: text().notNull(),
    ...timestamps,
  },
  (t) => [check("profile_singleton", sql`${t.id} = 1`)],
);

export const profileTranslations = pgTable(
  "profile_translations",
  {
    profileId: translationOf(() => profile.id),
    locale: localeEnum().notNull(),
    name: text(),
    headline: text(),
    /** Plain job title for structured data; `headline` is the hero's line, with the years in it. */
    jobTitle: text(),
    aboutShort: jsonb().$type<RichTextDoc>(),
    /** Per-locale CV. Null falls back to the English one. */
    cvUrl: text(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.locale] }),
    check(
      "profile_translations_en_complete",
      sql`${t.locale} <> 'en' or (${t.name} is not null and ${t.headline} is not null and ${t.jobTitle} is not null and ${t.aboutShort} is not null)`,
    ),
  ],
);
