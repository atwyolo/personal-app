import type { MetadataRoute } from "next";

import { siteUrl } from "@/shared/lib/site-url";

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/" },
  sitemap: new URL("/sitemap.xml", siteUrl).href,
});

export default robots;
