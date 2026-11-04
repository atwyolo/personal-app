import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { type Locale, locales } from "@/shared/lib/locales";

export interface ContentFile {
  /** The frontmatter as YAML parsed it. */
  data: Record<string, unknown>;
  /** The Markdown after the frontmatter. */
  body: string;
  /** Path from the repository root, for error messages. */
  file: string;
}

/** The content folder of the site: `messages/` in the repository root. */
export const contentRoot = path.join(process.cwd(), "messages");

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

/**
 * Reads `<root>/<locale>/<file>` synchronously. A sync read is "predictable" for Cache Components and is prerendered with
 * the page (node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md, "Prerendering"). Missing file: `null`.
 */
export const readContentFile = (root: string, locale: Locale, file: string): ContentFile | null => {
  const absolute = path.join(root, locale, file);
  let source: string;

  try {
    source = readFileSync(absolute, "utf8");
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }

  // Any options object turns off gray-matter's cache, which returns one shared, mutable result per identical input.
  const { data, content } = matter(source, {});

  return { data, body: content, file: path.relative(process.cwd(), absolute) };
};

const markdownFiles = (folder: string): string[] => {
  try {
    return readdirSync(folder).filter((name) => name.endsWith(".md"));
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
};

/**
 * Slugs of `<root>/en/<folder>/*.md`, sorted. A file in another locale's folder without an English counterpart throws:
 * it would never be read, and a misspelt name would leave a translation silently unused.
 */
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
