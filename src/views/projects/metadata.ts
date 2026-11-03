import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getPageMeta, getSiteMeta } from "@/db/queries/meta";
import { getLocaleAlternates } from "@/shared/lib/i18n/alternates";
import { buildPageMetadata } from "@/shared/lib/metadata";

/** Projects page metadata in the page's language, from the `meta_` tables. Both reads are cached: one per locale at build time. */
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const [page, site] = await Promise.all([getPageMeta(locale, "projects"), getSiteMeta(locale)]);

  return buildPageMetadata({ page, site, locale, alternates: getLocaleAlternates(locale, "/projects") });
};
