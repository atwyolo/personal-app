import "server-only";

import { cacheLife } from "next/cache";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { byCodePoint } from "./order";
import { contentRoot, listSlugs } from "./read";
import { experienceSchema } from "./schemas";
import { readSkillsFile } from "./skills";

export type ExperienceEntry = {
  slug: string;
  company: string;
  role: string | null;
  startDate: string;
  endDate: string | null;
  today: string;
  imageUrl: string | null;
  descriptionShort: string;
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

export async function getExperience(locale: Locale): Promise<ExperienceEntry[]> {
  "use cache";
  cacheLife("max");

  return readExperience(contentRoot, locale, new Date().toISOString().slice(0, 10));
}
