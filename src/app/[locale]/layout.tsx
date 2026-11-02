// Root layout: the [locale] segment sits at the top, so every locale gets its own prerendered <html lang>.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { appVersion } from "@/shared/lib/app-version";
import { locales } from "@/shared/lib/locales";
import { siteUrl } from "@/shared/lib/site-url";
import { SiteLayout } from "@/views/site-layout/SiteLayout";

import { ThemeProvider } from "../_providers/ThemeProvider";

import "../globals.css";

// next/font self-hosts the font at build time (no runtime requests to Google) and adds a metric-matched fallback.
// `subsets` only controls preloading: other glyphs (cyrillic, latin-ext for pl, de, fr...) still come from the same font,
// loaded on demand through unicode-range. Only one file is preloaded: a preloaded font takes the bandwidth from the photo,
// which is the LCP element, because both have High priority.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

// Makes relative metadata URLs (canonical, hreflang, Open Graph) absolute. Pages set their own title and description.
// `app-version` names the build in every page, to check a deployment in DevTools.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  other: { "app-version": appVersion },
};

// One prerendered tree per locale. Cache Components require at least one value for every root param.
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

const RootLayout: FC<LayoutProps<"/[locale]">> = async (props) => {
  const { children } = props;
  // Resolved by src/shared/lib/i18n/request.ts from the [locale] segment; an unknown locale ends in notFound().
  const locale = await getLocale();

  return (
    // suppressHydrationWarning: the theme script sets the class and color-scheme on <html> before React hydrates.
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Gives client components the locale and messages from the request config. */}
        <NextIntlClientProvider>
          <ThemeProvider>
            <SiteLayout>{children}</SiteLayout>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
