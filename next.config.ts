import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the per-request config (locale + messages).
const withNextIntl = createNextIntlPlugin("./src/shared/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    // Twice as fast a first paint on a slow connection, see docs/decisions/ADR-0011 Inline CSS.md.
    inlineCss: true,
  },
  partialPrefetching: true,
  // Content is read with fs at render time. Static pages read it during the build, but a render at request time (the 404
  // of an unknown path, whose header shows the profile) runs in a function that holds only traced files, and `fs` paths
  // built at runtime are not traced. Every server route gets the Markdown files.
  outputFileTracingIncludes: {
    "/**": ["./messages/**/*.md"],
  },
  // Dev server only: the home subnet, to open the site on a phone whatever address the router hands out.
  allowedDevOrigins: ["192.168.1.*"],
  images: {
    // AVIF first, WebP for browsers without it. Every extra quality or format multiplies the variants Vercel encodes.
    formats: ["image/avif", "image/webp"],
    qualities: [85],
    // Only our Blob store: the optimizer must not work as an open proxy for other sites' images.
    remotePatterns: [new URL("https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/**")],
  },
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
