import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import { loadMergedMessages } from "@/shared/lib/i18n/load-messages";
import type { MessagesTree } from "@/shared/lib/i18n/merge-messages";
import type { Locale } from "@/shared/lib/locales";

/** Every page with a node in `Meta`. A new page adds its key here and its node in messages/en.json. */
export type PageKey = "Home" | "About" | "Skills" | "Experience";

const text = z.string().trim().min(1);
/** `null` or an absolute `https://` URL, so a relative or empty URL never reaches the fallbacks or a redirect. */
const url = z.url({ protocol: /^https$/ }).nullable();

const siteSchema = z.strictObject({
  siteName: text,
  defaultTitle: text,
  iconIcoUrl: url,
  iconSvgUrl: url,
  iconPngUrl: url,
  appleTouchIconUrl: url,
  ogPlaceholderUrl: url,
  /** `true` adds `noindex, nofollow` to every page. */
  hiddenFromSearch: z.boolean(),
});

const pageSchema = z.strictObject({ title: text, description: text, ogImageUrl: url });

export type SiteMeta = z.infer<typeof siteSchema>;
export type PageMeta = z.infer<typeof pageSchema>;

const parse = <S extends z.ZodType>(schema: S, value: unknown, where: string): z.infer<S> => {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues.map((issue) => [where, ...issue.path].join(".") + `: ${issue.message}`).join("; ");
  throw new Error(`Invalid metadata in messages: ${issues}`);
};

const metaNode = (messages: MessagesTree, key: string): unknown => {
  const meta = messages.Meta;
  return typeof meta === "object" && meta !== null ? (meta as MessagesTree)[key] : undefined;
};

export const readSiteMeta = (messages: MessagesTree): SiteMeta => parse(siteSchema, metaNode(messages, "Common"), "Meta.Common");

export const readPageMeta = (messages: MessagesTree, key: PageKey): PageMeta => {
  const node = metaNode(messages, key);
  if (node === undefined) throw new Error(`Metadata of page "${key}" is missing: add Meta.${key} to messages/en.json`);

  return parse(pageSchema, node, `Meta.${key}`);
};

/**
 * Metadata in a locale, merged over English (`null` falls back). Cached like the content, so it stays in the static
 * shell; the locale is part of the cache key.
 */
export async function getSiteMeta(locale: Locale): Promise<SiteMeta> {
  "use cache";
  cacheLife("max");

  return readSiteMeta(await loadMergedMessages(locale));
}

export async function getPageMeta(locale: Locale, key: PageKey): Promise<PageMeta> {
  "use cache";
  cacheLife("max");

  return readPageMeta(await loadMergedMessages(locale), key);
}
