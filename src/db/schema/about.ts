import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { RichTextDoc } from "../../shared/lib/rich-text";
import { id, localeEnum, timestamps, translationOf } from "./common";

/** One question and answer of the About page interview. */
export const aboutPairs = pgTable("about_pairs", {
  id: id(),
  /** The section's id and the chip's anchor, e.g. /about#who. Entered by hand, never generated. */
  slug: text().notNull().unique(),
  sort: integer().notNull().default(0),
  ...timestamps,
});

export const aboutPairTranslations = pgTable(
  "about_pair_translations",
  {
    aboutPairId: translationOf(() => aboutPairs.id),
    locale: localeEnum().notNull(),
    /** Text of the sticky chip. */
    linkText: text(),
    /** Small label inside the question bubble. */
    questionTitle: text(),
    questionMessage: text(),
    answerTitle: text(),
    answerMessage: jsonb().$type<RichTextDoc>(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.aboutPairId, t.locale] }),
    check(
      "about_pair_translations_en_complete",
      sql`${t.locale} <> 'en' or (${t.linkText} is not null and ${t.questionTitle} is not null and ${t.questionMessage} is not null and ${t.answerTitle} is not null and ${t.answerMessage} is not null)`,
    ),
  ],
);
