import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getSiteMeta } from "@/content/meta";
import { appVersion } from "@/shared/lib/app-version";
import { buildSiteMetadata } from "@/shared/lib/metadata";
import { siteUrl } from "@/shared/lib/site-url";

/**
 * Site-wide metadata, re-exported by the root layout: `app` does not import `db`, so the read lives in a view.
 * - `metadataBase` makes relative metadata URLs (canonical, hreflang, Open Graph) absolute.
 * - `app-version` names the build in every page, to check a deployment in DevTools.
 * - The rest comes from `Meta.Common`: the default title, the icons, and `noindex` while the site is hidden.
 * Pages set their own title, description and Open Graph.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const site = await getSiteMeta(await getLocale());

  // The builder goes first, so nothing it returns can replace the base URL or the version tag.
  return {
    ...buildSiteMetadata(site),
    metadataBase: siteUrl,
    other: { "app-version": appVersion },
  };
};
