import "server-only";

import path from "node:path";

import type { z } from "zod";

import type { Locale } from "@/shared/lib/locales";

import { assertAllowedMarkdown } from "./markdown";
import { readContentFile } from "./read";

type Fields = Record<string, unknown>;

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

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
  path: string;
  schema: S;
  lists?: Record<string, string>;
}

export type Localized<S extends z.ZodType> = z.infer<S> & {
  body: string;
  slug: string;
};

export const loadLocalized = <S extends z.ZodType>(params: LoadLocalizedParams<S>): Localized<S> => {
  const { root, locale, path: file, schema, lists } = params;

  const en = readContentFile(root, "en", file);
  if (!en) throw new Error(`Content file missing: ${path.relative(process.cwd(), path.join(root, "en", file))}`);
  const translated = locale === "en" ? null : readContentFile(root, locale, file);

  assertAllowedMarkdown(en.body, en.file);
  if (translated) assertAllowedMarkdown(translated.body, translated.file);

  let parsed = validate(schema, en.data, en.file);
  if (translated) {
    let data: Fields;
    try {
      data = mergeFields(en.data, translated.data, lists);
    } catch (error) {
      throw new Error(`Invalid content in ${translated.file}: ${(error as Error).message}`);
    }
    parsed = validate(schema, data, translated.file);
  }

  const body = translated?.body.trim() ? translated.body : en.body;

  return { ...(parsed as object), body: body.trim(), slug: path.basename(file, ".md") } as Localized<S>;
};
