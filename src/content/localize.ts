import "server-only";

import path from "node:path";

import type { z } from "zod";

import type { Locale } from "@/shared/lib/locales";

import { assertAllowedMarkdown } from "./markdown";
import { readContentFile } from "./read";

type Fields = Record<string, unknown>;

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

/**
 * A locale's frontmatter over the English one, field by field: `null`, absent and empty values fall back to English.
 * `lists` names the fields that are lists of objects and the key of their items (`{ domains: "key" }`): those merge
 * item by item through that key, never by index, so reordering English cannot attach a translation to another item.
 */
export const mergeFields = <T extends Fields>(en: T, locale: Fields | undefined, lists: Record<string, string> = {}): T => {
  const result: Fields = { ...en };

  for (const [field, value] of Object.entries(locale ?? {})) {
    if (isMissing(value)) continue;

    const itemKey = lists[field];
    const base = en[field];

    if (itemKey && Array.isArray(base) && Array.isArray(value)) {
      const items = base as Fields[];
      for (const item of value as Fields[]) {
        if (!items.some((candidate) => candidate[itemKey] === item[itemKey])) {
          throw new Error(`${field}: no English item with ${itemKey} "${String(item[itemKey])}"`);
        }
      }
      result[field] = items.map((item) => mergeFields(item, (value as Fields[]).find((v) => v[itemKey] === item[itemKey])));
    } else {
      result[field] = value;
    }
  }

  return result as T;
};

const validate = <S extends z.ZodType>(schema: S, data: unknown, file: string): z.infer<S> => {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid content in ${file}: ${issues}`);
};

interface LoadLocalizedParams<S extends z.ZodType> {
  root: string;
  locale: Locale;
  /** Path inside the locale folder, e.g. `experience/glovo.md`. */
  path: string;
  schema: S;
  lists?: Record<string, string>;
}

export type Localized<S extends z.ZodType> = z.infer<S> & {
  /** Markdown body, trimmed; empty when the file has none. */
  body: string;
  /** The file name without `.md`: the anchor and the key. */
  slug: string;
};

/**
 * One content file in a locale: the English file (required), the locale's file over it (optional), the body checked
 * against the Markdown the site renders, the result validated by `schema`. Every error names the file.
 */
export const loadLocalized = <S extends z.ZodType>(params: LoadLocalizedParams<S>): Localized<S> => {
  const { root, locale, path: file, schema, lists } = params;

  const en = readContentFile(root, "en", file);
  if (!en) throw new Error(`Content file missing: ${path.relative(process.cwd(), path.join(root, "en", file))}`);
  const translated = locale === "en" ? null : readContentFile(root, locale, file);

  assertAllowedMarkdown(en.body, en.file);
  if (translated) assertAllowedMarkdown(translated.body, translated.file);

  // English alone first: it must be complete, and its errors must name its file even when a translation exists.
  let parsed = validate(schema, en.data, en.file);
  if (translated) {
    let data: Fields;
    try {
      data = mergeFields(en.data, translated.data, lists);
    } catch (error) {
      throw new Error(`Invalid content in ${translated.file}: ${(error as Error).message}`);
    }
    // English passed, so what fails now comes from the translation.
    parsed = validate(schema, data, translated.file);
  }

  const body = translated?.body.trim() ? translated.body : en.body;

  return { ...(parsed as object), body: body.trim(), slug: path.basename(file, ".md") } as Localized<S>;
};
