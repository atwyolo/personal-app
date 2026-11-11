import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getNotFoundMeta, getSiteMeta } from "@/content/meta";
import { appVersion } from "@/shared/lib/app-version";
import { buildSiteMetadata } from "@/shared/lib/metadata";
import { siteUrl } from "@/shared/lib/site-url";

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const [site, page] = await Promise.all([getSiteMeta(locale), getNotFoundMeta(locale)]);

  return {
    ...buildSiteMetadata(site),
    robots: null,
    title: page.title,
    metadataBase: siteUrl,
    other: { "app-version": appVersion },
  };
};
