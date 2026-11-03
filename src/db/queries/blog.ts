import "server-only";

import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { postTopicTranslations, postTopics, postTranslations, posts } from "@/db/schema";
import type { BlogListState } from "@/schemas/blog-list";
import type { Locale } from "@/shared/lib/locales";
import type { RichTextDoc } from "@/shared/lib/rich-text";
import { homeCacheTags, type PostPreview } from "./home";
import { localized, localizedOptional } from "./localized";

/**
 * Blog list data. Every read is `"use cache"` with the `posts` and `post-topics` tags, so the admin refreshes them
 * with `updateTag`. Only a state the catalog has validated reaches the reads that take filters as arguments, so an
 * arbitrary URL cannot create cache entries (see `resolveBlogListState`).
 *
 * A post's tags are its translation's tags, or the English ones when the translation has none, as on the cards.
 */

export type BlogCatalog = {
  /** Topics with at least one published post, in their `sort` order. */
  topics: { key: string; label: string }[];
  /** Every tag of a published post in this locale. */
  tags: string[];
  /** Published posts. */
  total: number;
};

export type BlogFacets = {
  /** Posts that match the tags, in every topic: the "All" chip. */
  allCount: number;
  /** Per topic key: posts of that topic that match the tags. A topic with no match is absent. */
  topicCounts: Record<string, number>;
  /** Per tag: posts with that tag in the selected topic. */
  tagCounts: Record<string, number>;
  /** Posts that match the topic and the tags. */
  matchCount: number;
};

/** Published posts with their topic key and tags in `locale`, as one CTE for the catalog and the facets. */
const visiblePosts = (locale: Locale) => sql`
  visible as (
    select p.id, t.key as topic, coalesce(tr.tags, en.tags) as tags
    from ${posts} p
    join ${postTranslations} en on en.post_id = p.id and en.locale = 'en'
    left join ${postTranslations} tr on tr.post_id = p.id and tr.locale = ${locale}
    join ${postTopics} t on t.id = p.topic_id
    where p.status = 'published'
  )`;

/** "The post has any of the tags": `&&` is array overlap. No tags means no tag filter. */
const anyTag = (column: SQL, tags: string[]): SQL =>
  tags.length === 0 ? sql`true` : sql`${column} && array[${sql.join(tags.map((tag) => sql`${tag}`), sql`, `)}]::text[]`;

export async function getBlogCatalog(locale: Locale): Promise<BlogCatalog> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const { rows } = await db.execute<{ kind: "topic" | "tag" | "total"; key: string | null; label: string | null; n: number }>(sql`
    with ${visiblePosts(locale)}
    select 'topic' as kind, t.key, coalesce(ttr.label, ten.label) as label, t.sort as n
    from ${postTopics} t
    join ${postTopicTranslations} ten on ten.topic_id = t.id and ten.locale = 'en'
    left join ${postTopicTranslations} ttr on ttr.topic_id = t.id and ttr.locale = ${locale}
    where t.key in (select topic from visible)
    union all
    select 'tag', tag, null, null from (select distinct unnest(tags) as tag from visible) as distinct_tags
    union all
    select 'total', null, null, count(*)::int from visible
  `);

  return {
    topics: rows
      .filter((row) => row.kind === "topic")
      .sort((a, b) => a.n - b.n)
      .map((row) => ({ key: row.key!, label: row.label! })),
    tags: rows.filter((row) => row.kind === "tag").map((row) => row.key!),
    total: rows.find((row) => row.kind === "total")?.n ?? 0,
  };
}

/** `tags` must be sorted by the caller: the order of selection must not split the cache. */
export async function getBlogFacets(locale: Locale, topic: string | null, tags: string[]): Promise<BlogFacets> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const tagsMatch = anyTag(sql`tags`, tags);
  const topicMatch = topic === null ? sql`true` : sql`topic = ${topic}`;

  // Each filter's counts apply the other filters but not itself (owner's rule, 2026-11-03).
  const { rows } = await db.execute<{ kind: "topic" | "tag" | "match"; key: string | null; n: number }>(sql`
    with ${visiblePosts(locale)}
    select 'topic' as kind, topic as key, count(*)::int as n from visible where ${tagsMatch} group by topic
    union all
    select 'tag', tag, count(*)::int from visible, unnest(tags) as tag where ${topicMatch} group by tag
    union all
    select 'match', null, count(*)::int from visible where ${tagsMatch} and ${topicMatch}
  `);

  const topicCounts = Object.fromEntries(rows.filter((row) => row.kind === "topic").map((row) => [row.key!, row.n]));
  return {
    allCount: Object.values(topicCounts).reduce((sum, n) => sum + n, 0),
    topicCounts,
    tagCounts: Object.fromEntries(rows.filter((row) => row.kind === "tag").map((row) => [row.key!, row.n])),
    matchCount: rows.find((row) => row.kind === "match")?.n ?? 0,
  };
}

export async function getBlogPage(locale: Locale, state: BlogListState): Promise<PostPreview[]> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const { topic, tags, sort, page, per } = state;
  const tr = alias(postTranslations, "tr");
  const en = alias(postTranslations, "en");
  const topicTr = alias(postTopicTranslations, "topic_tr");
  const topicEn = alias(postTopicTranslations, "topic_en");
  const order = sort === "newest" ? desc : asc;

  const rows = await db
    .select({
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      coverUrl: posts.coverUrl,
      topic: localized(topicTr.label, topicEn.label),
      title: localized(tr.title, en.title),
      contentShort: localized(tr.contentShort, en.contentShort),
      tags: localized(tr.tags, en.tags),
    })
    .from(posts)
    .innerJoin(en, and(eq(en.postId, posts.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.postId, posts.id), eq(tr.locale, locale)))
    .innerJoin(postTopics, eq(postTopics.id, posts.topicId))
    .innerJoin(topicEn, and(eq(topicEn.topicId, posts.topicId), eq(topicEn.locale, "en")))
    .leftJoin(topicTr, and(eq(topicTr.topicId, posts.topicId), eq(topicTr.locale, locale)))
    .where(
      and(
        eq(posts.status, "published"),
        topic === null ? undefined : eq(postTopics.key, topic),
        anyTag(sql`coalesce(${tr.tags}, ${en.tags})`, tags),
      ),
    )
    // The id breaks ties between posts of one date, so pages never overlap.
    .orderBy(order(posts.publishedAt), order(posts.id))
    .limit(per)
    .offset((page - 1) * per);

  return rows.map((row) => ({ ...row, publishedAt: row.publishedAt!.toISOString() }));
}

/** Every published post's slug: the post route's static params, and the check before `getPost` reads a slug. */
export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const rows = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.id));

  return rows.map((row) => row.slug);
}

export type Post = PostPreview & {
  /** The topic's key, for the link to the blog list filtered by it. */
  topicKey: string;
  contentFull: RichTextDoc | null;
};

/** One published post in `locale`, with English fallbacks; `null` for a draft or an unknown slug. */
export async function getPost(locale: Locale, slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const tr = alias(postTranslations, "tr");
  const en = alias(postTranslations, "en");
  const topicTr = alias(postTopicTranslations, "topic_tr");
  const topicEn = alias(postTopicTranslations, "topic_en");

  const [row] = await db
    .select({
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      coverUrl: posts.coverUrl,
      topic: localized(topicTr.label, topicEn.label),
      topicKey: postTopics.key,
      title: localized(tr.title, en.title),
      contentShort: localized(tr.contentShort, en.contentShort),
      contentFull: localizedOptional(tr.contentFull, en.contentFull),
      tags: localized(tr.tags, en.tags),
    })
    .from(posts)
    .innerJoin(en, and(eq(en.postId, posts.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.postId, posts.id), eq(tr.locale, locale)))
    .innerJoin(postTopics, eq(postTopics.id, posts.topicId))
    .innerJoin(topicEn, and(eq(topicEn.topicId, posts.topicId), eq(topicEn.locale, "en")))
    .leftJoin(topicTr, and(eq(topicTr.topicId, posts.topicId), eq(topicTr.locale, locale)))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  return row ? { ...row, publishedAt: row.publishedAt!.toISOString() } : null;
}
