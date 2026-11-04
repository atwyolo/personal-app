import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
  },
  partialPrefetching: true,
  outputFileTracingIncludes: {
    "/**": ["./messages/**/*.md"],
  },
  allowedDevOrigins: ["192.168.1.*"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [85],
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
