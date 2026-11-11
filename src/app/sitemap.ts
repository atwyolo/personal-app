import type { MetadataRoute } from "next";

import { siteUrl } from "@/shared/lib/site-url";
import { buildSitemap } from "@/shared/lib/sitemap";

const sitemap = (): MetadataRoute.Sitemap => buildSitemap(siteUrl);

export default sitemap;
