import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getPageMeta, getSiteMeta } from "@/db/queries/meta";
import { getLocaleAlternates } from "@/shared/lib/i18n/alternates";
import { buildPageMetadata } from "@/shared/lib/metadata";

/**
 * Blog list metadata in the page's language, from the `meta_` tables. One title and description for every state of
 * the list, and the canonical is the clean `/blog`, so filtered views are not indexed as pages of their own.
 * It reads no `searchParams`, so it stays in the static shell.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const [page, site] = await Promise.all([getPageMeta(locale, "blog"), getSiteMeta(locale)]);

  return buildPageMetadata({ page, site, locale, alternates: getLocaleAlternates(locale, "/blog") });
};
