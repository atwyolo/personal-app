import "server-only";

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cacheLife } from "next/cache";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { byCodePoint } from "./order";
import { contentRoot } from "./read";
import { profileSchema } from "./schemas";
import { readSkillsFile } from "./skills";

export type HomeProfile = {
  name: string;
  headline: string;
  /** Plain job title for structured data. */
  jobTitle: string;
  photoUrl: string | null;
  cvUrl: string | null;
  /** Markdown: Home's About tile. */
  aboutShort: string;
  /** Skills marked `main`, by `sort` then name. */
  heroSkills: string[];
  contacts: {
    whatsapp: { href: string; display: string };
    email: { href: string; display: string; mailbox: string };
    linkedin: { href: string; display: string };
  };
};

export const readProfile = (root: string, locale: Locale): HomeProfile => {
  const profile = loadLocalized({ root, locale, path: "profile.md", schema: profileSchema });
  const heroSkills = readSkillsFile(root, "en")
    .skills.filter((skill) => skill.main)
    .sort((a, b) => a.sort - b.sort || byCodePoint(a.name, b.name))
    .map((skill) => skill.name);
  const phone = parsePhoneNumberFromString(profile.whatsappPhone);

  return {
    name: profile.name,
    headline: profile.headline,
    jobTitle: profile.jobTitle,
    photoUrl: profile.photoUrl ?? null,
    cvUrl: profile.cvUrl ?? null,
    aboutShort: profile.body,
    heroSkills,
    contacts: {
      whatsapp: {
        href: `https://wa.me/${phone?.number.slice(1) ?? profile.whatsappPhone.replace(/\D/g, "")}`,
        display: phone?.formatInternational() ?? profile.whatsappPhone,
      },
      email: { href: `mailto:${profile.email}`, display: profile.email, mailbox: profile.email.split("@")[0] },
      linkedin: { href: profile.linkedinUrl, display: profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "") },
    },
  };
};

/** Cached as the other reads, see `skills.ts`. */
export async function getProfile(locale: Locale): Promise<HomeProfile> {
  "use cache";
  cacheLife("max");

  return readProfile(contentRoot, locale);
}
