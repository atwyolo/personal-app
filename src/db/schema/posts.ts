import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { RichTextDoc } from "../../shared/lib/rich-text";
import { id, localeEnum, timestamps, translationOf } from "./common";

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const postTopics = pgTable("post_topics", {
  id: id(),
  /** Stable machine key used in URLs and filters, e.g. `technical`. */
  key: text().notNull().unique(),
  sort: integer().notNull().default(0),
  ...timestamps,
});

export const postTopicTranslations = pgTable(
  "post_topic_translations",
  {
    topicId: translationOf(() => postTopics.id),
    locale: localeEnum().notNull(),
    label: text(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.topicId, t.locale] }),
    check("post_topic_translations_en_complete", sql`${t.locale} <> 'en' or ${t.label} is not null`),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: id(),
    /** One English slug for every locale. */
    slug: text().notNull().unique(),
    status: postStatusEnum().notNull().default("draft"),
    /** Exactly one topic per post. `restrict`: a topic cannot be deleted while posts still use it. */
    topicId: integer()
      .notNull()
      .references(() => postTopics.id, { onDelete: "restrict" }),
    publishedAt: timestamp({ withTimezone: true }),
    /** Vercel Blob URL. Alt text is the translated title. */
    coverUrl: text(),
    ...timestamps,
  },
  (t) => [
    check("posts_published_has_date", sql`${t.status} <> 'published' or ${t.publishedAt} is not null`),
    index("posts_status_published_at_idx").on(t.status, t.publishedAt.desc()),
    index("posts_topic_id_idx").on(t.topicId),
  ],
);

export const postTranslations = pgTable(
  "post_translations",
  {
    postId: translationOf(() => posts.id),
    locale: localeEnum().notNull(),
    title: text(),
    /** Card text, 2–3 sentences, plain. */
    contentShort: text(),
    /** The full post as Tiptap JSON, shown on the post page. */
    contentFull: jsonb().$type<RichTextDoc>(),
    /** Free-form tags per locale, not linked to skills. */
    tags: text().array(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.locale] }),
    check(
      "post_translations_en_complete",
      sql`${t.locale} <> 'en' or (${t.title} is not null and ${t.contentShort} is not null and ${t.tags} is not null)`,
    ),
  ],
);
