import "server-only";

import { cacheLife } from "next/cache";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { byCodePoint } from "./order";
import { contentRoot, listSlugs } from "./read";
import { experienceSchema } from "./schemas";
import { readSkillsFile } from "./skills";

/** A job as the Home cards and the Experience page show it. */
export type ExperienceEntry = {
  slug: string;
  company: string;
  role: string | null;
  /** "YYYY-MM-DD"; formatting and duration happen in the UI with next-intl. */
  startDate: string;
  endDate: string | null;
  /** "YYYY-MM-DD" when this result was cached: closes a running job; refreshed by the 30-day revalidation and by a deploy. */
  today: string;
  imageUrl: string | null;
  descriptionShort: string;
  /** Markdown under the short description on the Experience page; `null` when the file has no body. */
  descriptionFull: string | null;
  skills: string[];
};

export const readExperience = (root: string, locale: Locale, today: string): ExperienceEntry[] => {
  const known = new Set(readSkillsFile(root, "en").skills.map((skill) => skill.name));

  return listSlugs(root, "experience")
    .map((slug) => {
      const job = loadLocalized({ root, locale, path: `experience/${slug}.md`, schema: experienceSchema });
      const missing = job.skills.find((skill) => !known.has(skill));
      if (missing) {
        throw new Error(`Invalid content in messages/en/experience/${slug}.md: skill "${missing}" is not in skills.md`);
      }

      return { ...job, slug };
    })
    .sort((a, b) => a.sort - b.sort || byCodePoint(a.slug, b.slug))
    .map((job) => ({
      slug: job.slug,
      company: job.company,
      role: job.role ?? null,
      startDate: job.startDate,
      endDate: job.endDate ?? null,
      today,
      imageUrl: job.imageUrl ?? null,
      descriptionShort: job.descriptionShort,
      descriptionFull: job.body || null,
      skills: job.skills,
    }));
};

/** Cached as the other reads, see `skills.ts`. */
export async function getExperience(locale: Locale): Promise<ExperienceEntry[]> {
  "use cache";
  cacheLife("max");

  // A static render must not read the clock; inside "use cache" the value is simply part of the cached result.
  return readExperience(contentRoot, locale, new Date().toISOString().slice(0, 10));
}
