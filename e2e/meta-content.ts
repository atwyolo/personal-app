import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

import { mergeFields } from "@/content/merge-fields";
import type { Locale } from "@/shared/lib/locales";

export interface SiteMetaRow {
  siteName: string;
  defaultTitle: string;
  hiddenFromSearch: boolean;
  iconIcoUrl: string | null;
  iconSvgUrl: string | null;
  iconPngUrl: string | null;
  appleTouchIconUrl: string | null;
  ogPlaceholderUrl: string | null;
}

export interface PageMetaRow {
  title: string;
  description: string;
  ogImageUrl: string | null;
}

export type PageKey = "Home" | "About" | "Skills" | "Experience";

type MetaFile = Record<string, unknown>;

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m;

const read = (locale: Locale): MetaFile | undefined => {
  const file = path.join(process.cwd(), "messages", locale, "meta.md");
  if (!existsSync(file)) return undefined;

  const match = FRONTMATTER.exec(readFileSync(file, "utf8"));
  if (!match) throw new Error(`${file} has no frontmatter.`);

  return parse(match[1]) ?? {};
};

const meta = (locale: Locale): MetaFile => {
  const en = read("en");
  if (!en) throw new Error("messages/en/meta.md is missing.");

  return locale === "en" ? en : mergeFields(en, read(locale));
};

export const readSiteMeta = async (locale: Locale = "en"): Promise<SiteMetaRow> => meta(locale).Common as SiteMetaRow;

export const readPageMeta = async (key: PageKey, locale: Locale = "en"): Promise<PageMetaRow> => {
  const page = meta(locale)[key];
  if (!page) throw new Error(`${key} is missing in meta.md.`);

  return page as PageMetaRow;
};
