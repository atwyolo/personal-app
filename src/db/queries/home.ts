import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  experience,
  experienceSkills,
  experienceTranslations,
  postTopicTranslations,
  postTranslations,
  posts,
  profile,
  profileTranslations,
  skillDomainTranslations,
  skillDomains,
  skills,
} from "@/db/schema";
import type { Locale } from "@/shared/lib/locales";
import type { RichTextDoc } from "@/shared/lib/rich-text";
import { localized, localizedOptional } from "./localized";

/**
 * Home page data. Every function is cached with `"use cache"`:
 * - the result joins the static shell at build time, so the page is static;
 * - `cacheLife("max")` keeps it until something invalidates it;
 * - `cacheTag` names the entity, so the admin can refresh only what changed with `updateTag`.
 * The `locale` argument is part of the cache key: one entry per language.
 */
export const homeCacheTags = {
  profile: "profile",
  experience: "experience",
  skills: "skills",
  posts: "posts",
  postTopics: "post-topics",
} as const;

export type HomeProfile = {
  name: string;
  headline: string;
  /** Plain job title for structured data. */
  jobTitle: string;
  photoUrl: string | null;
  cvUrl: string | null;
  aboutShort: RichTextDoc;
  heroSkills: string[];
  contacts: {
    whatsapp: { href: string; display: string };
    email: { href: string; display: string; mailbox: string };
    linkedin: { href: string; display: string };
  };
};

export async function getProfile(locale: Locale): Promise<HomeProfile> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.profile, homeCacheTags.skills);

  const tr = alias(profileTranslations, "tr");
  const en = alias(profileTranslations, "en");

  // `batch` sends both queries in one HTTP request to Neon.
  const [rows, heroSkills] = await db.batch([
    db
      .select({
        photoUrl: profile.photoUrl,
        whatsappPhone: profile.whatsappPhone,
        email: profile.email,
        linkedinUrl: profile.linkedinUrl,
        name: localized(tr.name, en.name),
        headline: localized(tr.headline, en.headline),
        jobTitle: localized(tr.jobTitle, en.jobTitle),
        aboutShort: localized(tr.aboutShort, en.aboutShort),
        cvUrl: localizedOptional(tr.cvUrl, en.cvUrl),
      })
      .from(profile)
      .innerJoin(en, and(eq(en.profileId, profile.id), eq(en.locale, "en")))
      .leftJoin(tr, and(eq(tr.profileId, profile.id), eq(tr.locale, locale)))
      .limit(1),
    db.select({ name: skills.name }).from(skills).where(eq(skills.main, true)).orderBy(asc(skills.sort), asc(skills.name)),
  ]);

  const row = rows[0];
  if (!row) throw new Error("Profile is missing. Run `npm run db:seed`.");

  const phone = parsePhoneNumberFromString(row.whatsappPhone);

  return {
    name: row.name,
    headline: row.headline,
    jobTitle: row.jobTitle,
    photoUrl: row.photoUrl,
    cvUrl: row.cvUrl,
    aboutShort: row.aboutShort,
    heroSkills: heroSkills.map((s) => s.name),
    contacts: {
      whatsapp: {
        href: `https://wa.me/${phone?.number.slice(1) ?? row.whatsappPhone.replace(/\D/g, "")}`,
        display: phone?.formatInternational() ?? row.whatsappPhone,
      },
      email: { href: `mailto:${row.email}`, display: row.email, mailbox: row.email.split("@")[0] },
      linkedin: { href: row.linkedinUrl, display: row.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "") },
    },
  };
}

/** A job as the Home cards and the Projects page show it. */
export type Experience = {
  slug: string;
  company: string;
  role: string | null;
  /** "YYYY-MM-DD"; formatting and duration happen in the UI with next-intl. */
  startDate: string;
  endDate: string | null;
  /** "YYYY-MM-DD" when this result was cached: closes a running job, frozen until the next build or `updateTag`. */
  today: string;
  imageUrl: string | null;
  descriptionShort: string;
  descriptionFull: RichTextDoc | null;
  skills: string[];
};

export async function getExperience(locale: Locale): Promise<Experience[]> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.experience, homeCacheTags.skills);

  const tr = alias(experienceTranslations, "tr");
  const en = alias(experienceTranslations, "en");

  const [jobs, links] = await db.batch([
    db
      .select({
        id: experience.id,
        slug: experience.slug,
        company: experience.company,
        role: localizedOptional(tr.role, en.role),
        startDate: experience.startDate,
        endDate: experience.endDate,
        imageUrl: experience.imageUrl,
        descriptionShort: localized(tr.descriptionShort, en.descriptionShort),
        descriptionFull: localizedOptional(tr.descriptionFull, en.descriptionFull),
      })
      .from(experience)
      .innerJoin(en, and(eq(en.experienceId, experience.id), eq(en.locale, "en")))
      .leftJoin(tr, and(eq(tr.experienceId, experience.id), eq(tr.locale, locale)))
      .orderBy(asc(experience.sort)),
    db
      .select({ experienceId: experienceSkills.experienceId, name: skills.name })
      .from(experienceSkills)
      .innerJoin(skills, eq(skills.id, experienceSkills.skillId))
      .orderBy(asc(experienceSkills.sort)),
  ]);

  // A static render must not read the clock; inside "use cache" the value is simply part of the cached result.
  const today = new Date().toISOString().slice(0, 10);

  return jobs.map(({ id, ...job }) => ({
    ...job,
    today,
    skills: links.filter((link) => link.experienceId === id).map((link) => link.name),
  }));
}

/** Every skill and the domains that hold at least one, as the Skills page shows them. */
export type SkillList = {
  domains: { key: string; label: string; count: number }[];
  skills: { name: string; level: number; domain: string }[];
};

export async function getSkills(locale: Locale): Promise<SkillList> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.skills);

  const tr = alias(skillDomainTranslations, "tr");
  const en = alias(skillDomainTranslations, "en");

  const [domainRows, skillRows] = await db.batch([
    db
      .select({ id: skillDomains.id, key: skillDomains.key, label: localized(tr.label, en.label) })
      .from(skillDomains)
      .innerJoin(en, and(eq(en.domainId, skillDomains.id), eq(en.locale, "en")))
      .leftJoin(tr, and(eq(tr.domainId, skillDomains.id), eq(tr.locale, locale)))
      .orderBy(asc(skillDomains.sort)),
    db
      .select({ name: skills.name, level: skills.level, domain: skillDomains.key })
      .from(skills)
      .innerJoin(skillDomains, eq(skillDomains.id, skills.domainId))
      // Explorer default order from the design: level desc, then manual sort, then name.
      .orderBy(desc(skills.level), asc(skills.sort), asc(skills.name)),
  ]);

  return {
    domains: domainRows
      .map((d) => ({
        key: d.key,
        label: d.label,
        count: skillRows.filter((s) => s.domain === d.key).length,
      }))
      // The admin can create an empty domain; its chip could only lead to the empty state.
      .filter((d) => d.count > 0),
    skills: skillRows,
  };
}

export type HomeTopSkills = {
  skills: { name: string; level: number }[];
  /** Every skill on the site, not only the marked ones. */
  total: number;
};

/** Tech names are not translated, so there is no locale and one cache entry for all languages. */
export async function getTopSkills(): Promise<HomeTopSkills> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.skills);

  const [topSkills, totals] = await db.batch([
    db
      .select({ name: skills.name, level: skills.level })
      .from(skills)
      .where(eq(skills.top, true))
      .orderBy(desc(skills.level), asc(skills.sort), asc(skills.name)),
    db.select({ total: count() }).from(skills),
  ]);

  return { skills: topSkills, total: totals[0].total };
}

export type HomePost = {
  slug: string;
  /** ISO timestamp; formatted in the UI with next-intl. */
  publishedAt: string;
  coverUrl: string | null;
  /** The topic's label in the requested locale. */
  topic: string;
  title: string;
  excerpt: RichTextDoc;
  tags: string[];
};

export async function getLatestPosts(locale: Locale, limit = 3): Promise<HomePost[]> {
  "use cache";
  cacheLife("max");
  cacheTag(homeCacheTags.posts, homeCacheTags.postTopics);

  const tr = alias(postTranslations, "tr");
  const en = alias(postTranslations, "en");
  const topicTr = alias(postTopicTranslations, "topic_tr");
  const topicEn = alias(postTopicTranslations, "topic_en");

  const rows = await db
    .select({
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      coverUrl: posts.coverUrl,
      topic: localized(topicTr.label, topicEn.label),
      title: localized(tr.title, en.title),
      excerpt: localized(tr.excerpt, en.excerpt),
      tags: localized(tr.tags, en.tags),
    })
    .from(posts)
    .innerJoin(en, and(eq(en.postId, posts.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.postId, posts.id), eq(tr.locale, locale)))
    .innerJoin(topicEn, and(eq(topicEn.topicId, posts.topicId), eq(topicEn.locale, "en")))
    .leftJoin(topicTr, and(eq(topicTr.topicId, posts.topicId), eq(topicTr.locale, locale)))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt!.toISOString(),
  }));
}
