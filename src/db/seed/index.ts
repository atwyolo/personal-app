/**
 * Fills an empty database with the initial content. Run with `npm run db:seed`.
 *
 * There is one database for every environment (ADR-0002), so this script never deletes
 * or overwrites anything: each group of tables, or each field, is filled only while it is empty.
 */
import "../load-env"; // must stay first: the db client reads DATABASE_URL on import
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "..";
import {
  aboutPairTranslations,
  aboutPairs,
  experience,
  experienceSkills,
  experienceTranslations,
  metaPageTranslations,
  metaPages,
  metaSiteSettings,
  metaSiteSettingsTranslations,
  postTopicTranslations,
  postTopics,
  postTranslations,
  posts,
  profile,
  profileTranslations,
  skillDomainTranslations,
  skillDomains,
  skills,
} from "../schema";
import { locales } from "@/shared/lib/locales";
import * as data from "./data";

async function seedContent() {
  const [hasDomains, hasProfile] = await db.batch([
    db.select({ id: skillDomains.id }).from(skillDomains).limit(1),
    db.select({ id: profile.id }).from(profile).limit(1),
  ]);
  if (hasDomains.length > 0 || hasProfile.length > 0) {
    console.log("The database already has content. Seed skipped: it never overwrites data.");
    return;
  }

  // Round trip 1: domains and topics, because skills and posts need their ids.
  const [domainRows, topicRows] = await db.batch([
    db
      .insert(skillDomains)
      .values(data.domains.map((d, index) => ({ key: d.key, sort: index })))
      .returning({ id: skillDomains.id, key: skillDomains.key }),
    db
      .insert(postTopics)
      .values(data.postTopics.map((t, index) => ({ key: t.key, sort: index })))
      .returning({ id: postTopics.id, key: postTopics.key }),
  ]);
  const domainId = new Map(domainRows.map((row) => [row.key, row.id]));
  const topicId = new Map(topicRows.map((row) => [row.key, row.id]));

  // Round trip 2: base rows that do not depend on each other, in one batch.
  const [skillRows, experienceRows, postRows] = await db.batch([
    db
      .insert(skills)
      .values(
        data.skills.map((s) => ({
          name: s.name,
          level: s.level,
          domainId: domainId.get(s.domain)!,
          main: s.main,
          top: s.top,
          sort: s.sort,
        })),
      )
      .returning({ id: skills.id, name: skills.name }),
    db
      .insert(experience)
      .values(
        data.experience.map((e, index) => ({
          slug: e.slug,
          company: e.company,
          startDate: e.startDate,
          endDate: e.endDate,
          imageUrl: e.imageUrl,
          sort: index,
        })),
      )
      .returning({ id: experience.id, slug: experience.slug }),
    db
      .insert(posts)
      .values(
        data.posts.map((p) => ({
          slug: p.slug,
          topicId: topicId.get(p.topic)!,
          status: "published" as const,
          publishedAt: new Date(p.publishedAt),
        })),
      )
      .returning({ id: posts.id, slug: posts.slug }),
  ]);
  const skillId = new Map(skillRows.map((row) => [row.name, row.id]));
  const experienceId = new Map(experienceRows.map((row) => [row.slug, row.id]));
  const postId = new Map(postRows.map((row) => [row.slug, row.id]));

  // Round trip 3: everything that references those ids. A batch runs as one transaction.
  await db.batch([
    db.insert(skillDomainTranslations).values(
      data.domains.map((d) => ({ domainId: domainId.get(d.key)!, locale: "en" as const, label: d.label })),
    ),
    db.insert(postTopicTranslations).values(
      data.postTopics.flatMap((t) =>
        locales.map((locale) => ({ topicId: topicId.get(t.key)!, locale, label: t.labels[locale] })),
      ),
    ),
    db.insert(profile).values({
      photoUrl: data.profile.photoUrl,
      whatsappPhone: data.profile.whatsappPhone,
      email: data.profile.email,
      linkedinUrl: data.profile.linkedinUrl,
    }),
    db.insert(profileTranslations).values({ profileId: 1, locale: "en", ...data.profile.en }),
    db.insert(experienceTranslations).values(
      data.experience.map((e) => ({
        experienceId: experienceId.get(e.slug)!,
        locale: "en" as const,
        role: e.role,
        descriptionShort: e.descriptionShort,
        descriptionFull: e.descriptionFull,
      })),
    ),
    db.insert(experienceSkills).values(
      data.experience.flatMap((e) =>
        e.skills.map((name, index) => {
          const id = skillId.get(name);
          if (!id) throw new Error(`Experience "${e.slug}" references unknown skill "${name}".`);
          return { experienceId: experienceId.get(e.slug)!, skillId: id, sort: index };
        }),
      ),
    ),
    db.insert(postTranslations).values(
      data.posts.map((p) => ({
        postId: postId.get(p.slug)!,
        locale: "en" as const,
        title: p.title,
        contentShort: p.contentShort,
        contentFull: data.postBody,
        tags: p.tags,
      })),
    ),
  ]);

  console.log(
    `Seeded: ${domainRows.length} domains, ${skillRows.length} skills, ${experienceRows.length} jobs, ${topicRows.length} topics, ${postRows.length} posts, 1 profile.`,
  );
}

/**
 * Fills the fields a job got after the first seed, on a database that already holds the jobs.
 * Each field has its own guard, so text written later is never overwritten and a second run changes nothing.
 */
async function seedExperienceDetails() {
  const jobs = await db.select({ id: experience.id, slug: experience.slug }).from(experience);
  const experienceId = new Map(jobs.map((job) => [job.slug, job.id]));

  const updates = data.experience.flatMap((job) => {
    const id = experienceId.get(job.slug);
    if (id === undefined) return [];

    const enRow = and(eq(experienceTranslations.experienceId, id), eq(experienceTranslations.locale, "en"));

    return [
      db
        .update(experienceTranslations)
        .set({ role: job.role })
        .where(and(enRow, isNull(experienceTranslations.role)))
        .returning({ id: experienceTranslations.experienceId }),
      db
        .update(experienceTranslations)
        .set({ descriptionFull: job.descriptionFull })
        .where(and(enRow, isNull(experienceTranslations.descriptionFull)))
        .returning({ id: experienceTranslations.experienceId }),
    ];
  });

  const [first, ...rest] = updates;
  if (!first) return;

  const results = await db.batch([first, ...rest]);
  console.log(`Seeded: ${results.flat().length} experience fields.`);
}

/**
 * Has its own guard, so it also runs on a database that already holds the rest of the content.
 * Two round trips are not one transaction: if the second fails, delete the rows of `about_pairs` and run again.
 */
async function seedAboutPairs() {
  const existing = await db.select({ id: aboutPairs.id }).from(aboutPairs).limit(1);
  if (existing.length > 0) {
    console.log("About pairs already exist. Seed skipped.");
    return;
  }

  const pairRows = await db
    .insert(aboutPairs)
    .values(data.aboutPairs.map((p, index) => ({ slug: p.slug, sort: index })))
    .returning({ id: aboutPairs.id, slug: aboutPairs.slug });
  const pairId = new Map(pairRows.map((row) => [row.slug, row.id]));

  await db.insert(aboutPairTranslations).values(
    data.aboutPairs.map(({ slug, ...texts }) => ({
      aboutPairId: pairId.get(slug)!,
      locale: "en" as const,
      ...texts,
    })),
  );

  console.log(`Seeded: ${pairRows.length} about pairs.`);
}

/**
 * Adds the posts of `data.posts` whose slug is missing, with their `en` texts, on a database that already holds content.
 * After a seed from scratch `seedContent` has inserted them all, and this inserts nothing.
 * Two round trips are not one transaction: if the second fails, delete the new rows of `posts` and run again.
 */
async function seedMorePosts() {
  const topicRows = await db.select({ id: postTopics.id, key: postTopics.key }).from(postTopics);
  const topicId = new Map(topicRows.map((row) => [row.key, row.id]));

  const newPosts = await db
    .insert(posts)
    .values(
      data.posts.map((p) => {
        const id = topicId.get(p.topic);
        if (!id) throw new Error(`Post "${p.slug}" references unknown topic "${p.topic}".`);
        return { slug: p.slug, topicId: id, status: "published" as const, publishedAt: new Date(p.publishedAt) };
      }),
    )
    .onConflictDoNothing({ target: posts.slug })
    .returning({ id: posts.id, slug: posts.slug });

  if (newPosts.length > 0) {
    const bySlug = new Map(data.posts.map((p) => [p.slug, p]));
    await db.insert(postTranslations).values(
      newPosts.map((row) => {
        const p = bySlug.get(row.slug)!;
        return {
          postId: row.id,
          locale: "en" as const,
          title: p.title,
          contentShort: p.contentShort,
          contentFull: data.postBody,
          tags: p.tags,
        };
      }),
    );
  }

  console.log(`Seeded: ${newPosts.length} more posts.`);
}

/**
 * Fills the demo body into the seed's own posts (the slugs of `data.posts`) whose English row has none yet. Only those:
 * a real post left without a body on purpose never gets the demo article from a later `db:seed`. A body written
 * later, in the admin or by hand, is never overwritten, and a second run changes nothing.
 */
async function seedPostBodies() {
  const seedPosts = db
    .select({ id: posts.id })
    .from(posts)
    .where(inArray(posts.slug, data.posts.map((p) => p.slug)));

  const filled = await db
    .update(postTranslations)
    .set({ contentFull: data.postBody })
    .where(
      and(
        eq(postTranslations.locale, "en"),
        isNull(postTranslations.contentFull),
        inArray(postTranslations.postId, seedPosts),
      ),
    )
    .returning({ id: postTranslations.postId });

  console.log(`Seeded: ${filled.length} post bodies.`);
}

/**
 * Fills the metadata tables where rows are missing: the settings singleton, the pages and their `en` texts.
 * Every insert skips a row that exists (`on conflict do nothing`), so a second run, or a run after a text
 * was edited by hand, changes nothing. URLs stay empty and `hidden_from_search` takes its default, `true`.
 */
async function seedMeta() {
  const keys = data.meta.pages.map((p) => p.key);

  // Round trip 1, one transaction in this order: the singleton before its translation.
  const [settings, settingsTexts, newPages] = await db.batch([
    db.insert(metaSiteSettings).values({ id: 1 }).onConflictDoNothing().returning({ id: metaSiteSettings.id }),
    db
      .insert(metaSiteSettingsTranslations)
      .values({ settingsId: 1, locale: "en", ...data.meta.site })
      .onConflictDoNothing()
      .returning({ id: metaSiteSettingsTranslations.settingsId }),
    db
      .insert(metaPages)
      .values(keys.map((key) => ({ key })))
      .onConflictDoNothing()
      .returning({ id: metaPages.id }),
  ]);

  // Round trip 2: ids of every page, new or not, because a page may exist without its `en` row.
  const pageRows = await db.select({ id: metaPages.id, key: metaPages.key }).from(metaPages).where(inArray(metaPages.key, keys));
  const pageId = new Map(pageRows.map((row) => [row.key, row.id]));

  // Round trip 3.
  const pageTexts = await db
    .insert(metaPageTranslations)
    .values(data.meta.pages.map(({ key, ...texts }) => ({ pageId: pageId.get(key)!, locale: "en" as const, ...texts })))
    .onConflictDoNothing()
    .returning({ id: metaPageTranslations.pageId });

  console.log(
    `Seeded metadata: ${settings.length} settings row, ${settingsTexts.length} settings texts, ${newPages.length} pages, ${pageTexts.length} page texts.`,
  );
}

async function main() {
  await seedContent();
  await seedMorePosts();
  await seedPostBodies();
  await seedExperienceDetails();
  await seedAboutPairs();
  await seedMeta();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
