import { readFileSync } from "node:fs";
import path from "node:path";

import { mergeMessages, type MessagesTree } from "@/shared/lib/i18n/merge-messages";
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

const read = (locale: Locale): MessagesTree =>
  JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8"));

const meta = (locale: Locale) => {
  const messages = locale === "en" ? read("en") : mergeMessages(read("en"), read(locale));
  return messages.Meta as unknown as Record<string, unknown>;
};

export const readSiteMeta = async (locale: Locale = "en"): Promise<SiteMetaRow> => meta(locale).Common as SiteMetaRow;

export const readPageMeta = async (key: PageKey, locale: Locale = "en"): Promise<PageMetaRow> => {
  const page = meta(locale)[key];
  if (!page) throw new Error(`Meta.${key} is missing.`);

  return page as PageMetaRow;
};
