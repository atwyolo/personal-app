import { sql } from "drizzle-orm";
import { check, date, index, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { RichTextDoc } from "../../shared/lib/rich-text";
import { id, localeEnum, timestamps, translationOf } from "./common";
import { skills } from "./skills";

export const experience = pgTable(
  "experience",
  {
    id: id(),
    /** Anchor for "Learn more", e.g. /projects#glovo. */
    slug: text().notNull().unique(),
    /** Not translated. Also the image alt text. */
    company: text().notNull(),
    /** First day of the month; `mode: "string"` keeps it as "YYYY-MM-DD", no timezone shifts. */
    startDate: date({ mode: "string" }).notNull(),
    /** Null means "present". */
    endDate: date({ mode: "string" }),
    imageUrl: text(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [check("experience_dates_order", sql`${t.endDate} is null or ${t.endDate} >= ${t.startDate}`)],
);

export const experienceTranslations = pgTable(
  "experience_translations",
  {
    experienceId: translationOf(() => experience.id),
    locale: localeEnum().notNull(),
    role: text(),
    descriptionShort: text(),
    descriptionFull: jsonb().$type<RichTextDoc>(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.experienceId, t.locale] }),
    check("experience_translations_en_complete", sql`${t.locale} <> 'en' or ${t.descriptionShort} is not null`),
  ],
);

/** Many-to-many: skills shown as chips on an experience card, in a chosen order. */
export const experienceSkills = pgTable(
  "experience_skills",
  {
    experienceId: integer()
      .notNull()
      .references(() => experience.id, { onDelete: "cascade" }),
    skillId: integer()
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    sort: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.experienceId, t.skillId] }),
    index("experience_skills_skill_id_idx").on(t.skillId),
  ],
);
