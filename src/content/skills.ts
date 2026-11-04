import "server-only";

import { cacheLife } from "next/cache";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { byCodePoint } from "./order";
import { contentRoot } from "./read";
import { skillsSchema } from "./schemas";

const FILE = "skills.md";

/** Every skill and the domains that hold at least one, as the Skills page shows them. */
export type SkillList = {
  domains: { key: string; label: string; count: number }[];
  skills: { name: string; level: number; domain: string }[];
};

export type HomeTopSkills = {
  skills: { name: string; level: number }[];
  /** Every skill on the site, not only the marked ones. */
  total: number;
};

/**
 * `skills.md` in a locale, validated across its lists: every domain exists, no skill or domain appears twice.
 * Skills come back in the explorer's order: level desc, then `sort`, then name.
 */
export const readSkillsFile = (root: string, locale: Locale) => {
  const file = loadLocalized({ root, locale, path: FILE, schema: skillsSchema, lists: { domains: "key", skills: "name" } });
  const where = `messages/${locale}/${FILE}`;

  const keys = new Set<string>();
  for (const { key } of file.domains) {
    if (keys.has(key)) throw new Error(`Invalid content in ${where}: domain "${key}" is listed twice`);
    keys.add(key);
  }

  const names = new Set<string>();
  for (const skill of file.skills) {
    if (names.has(skill.name)) throw new Error(`Invalid content in ${where}: skill ${skill.name} is listed twice`);
    if (!keys.has(skill.domain)) {
      throw new Error(`Invalid content in ${where}: skill ${skill.name} names the domain "${skill.domain}", which is not in domains`);
    }
    names.add(skill.name);
  }

  const skills = [...file.skills].sort((a, b) => b.level - a.level || a.sort - b.sort || byCodePoint(a.name, b.name));

  return { domains: file.domains, skills };
};

export const readSkillList = (root: string, locale: Locale): SkillList => {
  const { domains, skills } = readSkillsFile(root, locale);

  return {
    domains: domains
      .map(({ key, label }) => ({ key, label, count: skills.filter((skill) => skill.domain === key).length }))
      // A domain without skills could only lead to the empty state.
      .filter((domain) => domain.count > 0),
    skills: skills.map(({ name, level, domain }) => ({ name, level, domain })),
  };
};

/** Tech names are not translated, so English is read and one cache entry serves every language. */
export const readTopSkills = (root: string): HomeTopSkills => {
  const { skills } = readSkillsFile(root, "en");

  return { skills: skills.filter((skill) => skill.top).map(({ name, level }) => ({ name, level })), total: skills.length };
};

/**
 * Cached reads: the result joins the static shell at build time. `cacheLife("max")` re-renders it in the background at
 * most every 30 days; the files of a deployment never change, so only clock-based values move. No tags. The locale is
 * part of the cache key.
 */
export async function getSkills(locale: Locale): Promise<SkillList> {
  "use cache";
  cacheLife("max");

  return readSkillList(contentRoot, locale);
}

export async function getTopSkills(): Promise<HomeTopSkills> {
  "use cache";
  cacheLife("max");

  return readTopSkills(contentRoot);
}
