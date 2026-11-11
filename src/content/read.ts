import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

import { type Locale, locales } from "@/shared/lib/locales";

export interface ContentFile {
  data: Record<string, unknown>;
  body: string;
  file: string;
}

export const resolveContentRoot = (configured: string | undefined, cwd: string): string =>
  configured ? path.resolve(cwd, configured) : path.join(cwd, "messages");

export const contentRoot = resolveContentRoot(process.env.CONTENT_ROOT, process.cwd());

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m;

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

export const readContentFile = (root: string, locale: Locale, file: string): ContentFile | null => {
  const absolute = path.join(root, locale, file);
  let source: string;

  try {
    source = readFileSync(absolute, "utf8");
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }

  const relative = path.relative(process.cwd(), absolute);
  const match = FRONTMATTER.exec(source);
  if (!match || match.index !== 0) return { data: {}, body: source, file: relative };

  let data: unknown;
  try {
    data = parse(match[1]) ?? {};
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${relative}: ${(error as Error).message}`);
  }
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Invalid frontmatter in ${relative}: expected a mapping of fields`);
  }

  return { data: data as Record<string, unknown>, body: source.slice(match[0].length), file: relative };
};

const markdownFiles = (folder: string): string[] => {
  try {
    return readdirSync(folder).filter((name) => name.endsWith(".md"));
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
};

export const listSlugs = (root: string, folder: string): string[] => {
  const english = markdownFiles(path.join(root, "en", folder));

  for (const locale of locales) {
    if (locale === "en") continue;
    for (const name of markdownFiles(path.join(root, locale, folder))) {
      if (!english.includes(name)) {
        const file = path.relative(process.cwd(), path.join(root, locale, folder, name));
        throw new Error(`Content file ${file} has no English counterpart`);
      }
    }
  }

  return english.map((name) => name.slice(0, -".md".length)).sort();
};
