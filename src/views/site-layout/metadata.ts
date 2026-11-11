import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getSiteMeta } from "@/content/meta";
import { appVersion } from "@/shared/lib/app-version";
import { buildSiteMetadata, buildSiteViewport } from "@/shared/lib/metadata";
import { siteUrl } from "@/shared/lib/site-url";

export const generateMetadata = async (): Promise<Metadata> => {
  const site = await getSiteMeta(await getLocale());

  return {
    ...buildSiteMetadata(site),
    metadataBase: siteUrl,
    other: { "app-version": appVersion },
  };
};

export const viewport = buildSiteViewport();
