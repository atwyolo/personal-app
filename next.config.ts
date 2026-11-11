import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { blobOrigin } from "./src/shared/lib/blob-origin";
import { buildSecurityHeaders } from "./src/shared/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/shared/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
    globalNotFound: true,
  },
  partialPrefetching: true,
  outputFileTracingIncludes: {
    "/**": ["./messages/**/*.md"],
  },
  allowedDevOrigins: ["192.168.1.*"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [85],
    remotePatterns: [new URL(`${blobOrigin}/**`)],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: buildSecurityHeaders({ development: process.env.NODE_ENV === "development" }),
    },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
