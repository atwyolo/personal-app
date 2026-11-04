import { z } from "zod";

/**
 * Zod schemas of the Markdown files' frontmatter, applied after the locale is merged over English, so English must be
 * complete and other locales may be partial. Strict objects: a misspelt field fails the build instead of being ignored.
 */

const text = z.string().trim().min(1);

/** `YYYY-MM-DD`. YAML reads an unquoted date as a `Date` at midnight UTC; it is turned back into the same string. */
const isoDate = z.union([z.iso.date(), z.date().transform((date) => date.toISOString().slice(0, 10))]);

/** Absolute `https://` only: Blob URLs and profile links. */
const httpsUrl = z.url({ protocol: /^https$/ });

/** Lowercase key used in code and URLs, e.g. a skill domain. */
const key = z.string().regex(/^[a-z0-9-]+$/);

export const profileSchema = z.strictObject({
  name: text,
  headline: text,
  /** Plain job title for structured data. */
  jobTitle: text,
  photoUrl: httpsUrl.optional(),
  /** The Blob `downloadUrl` (`?download=1`): `<a download>` is ignored cross-origin. Per locale. */
  cvUrl: httpsUrl.optional(),
  /** E.164; the link and the display format are derived. */
  whatsappPhone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  email: z.email(),
  linkedinUrl: httpsUrl,
});

export const skillsSchema = z.strictObject({
  /** Display order of the domain filters. */
  domains: z.array(z.strictObject({ key, label: text })).min(1),
  skills: z.array(
    z.strictObject({
      name: text,
      level: z.int().min(1).max(10),
      /** A `domains[].key`. */
      domain: key,
      /** A hero chip. */
      main: z.boolean().default(false),
      /** Shown in "My top skills" on Home. */
      top: z.boolean().default(false),
      /** Tie-breaker after the level: level desc, then `sort`, then name. */
      sort: z.int().default(0),
    }),
  ),
});

export const experienceSchema = z.strictObject({
  company: text,
  role: text.optional(),
  startDate: isoDate,
  /** Absent while the job is running. */
  endDate: isoDate.optional(),
  imageUrl: httpsUrl.optional(),
  sort: z.int(),
  /** Names from `skills.md`, in display order. */
  skills: z.array(text),
  /** Plain text, up to three sentences: the Home card and the top of the job on the Experience page. */
  descriptionShort: text,
});

export const aboutPairSchema = z.strictObject({
  sort: z.int(),
  linkText: text,
  questionTitle: text,
  questionMessage: text,
  answerTitle: text,
});
