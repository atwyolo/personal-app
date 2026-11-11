import "server-only";

import { cacheLife } from "next/cache";
import type { z } from "zod";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { contentRoot } from "./read";
import { metaSchema, type notFoundMetaSchema, type pageMetaSchema, type siteMetaSchema } from "./schemas";

export type PageKey = "Home" | "About" | "Skills" | "Experience";

export type SiteMeta = z.infer<typeof siteMetaSchema>;
export type PageMeta = z.infer<typeof pageMetaSchema>;
export type NotFoundMeta = z.infer<typeof notFoundMetaSchema>;
export type Meta = z.infer<typeof metaSchema>;

export const readMeta = (root: string, locale: Locale): Meta => {
  const { Common, Home, About, Skills, Experience, NotFound } = loadLocalized({ root, locale, path: "meta.md", schema: metaSchema });

  return { Common, Home, About, Skills, Experience, NotFound };
};

export async function getSiteMeta(locale: Locale): Promise<SiteMeta> {
  "use cache";
  cacheLife("max");

  return readMeta(contentRoot, locale).Common;
}

export async function getPageMeta(locale: Locale, key: PageKey): Promise<PageMeta> {
  "use cache";
  cacheLife("max");

  return readMeta(contentRoot, locale)[key];
}

export async function getNotFoundMeta(locale: Locale): Promise<NotFoundMeta> {
  "use cache";
  cacheLife("max");

  return readMeta(contentRoot, locale).NotFound;
}
