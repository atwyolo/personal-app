// Root layout: the [locale] segment sits at the top, so every locale gets its own prerendered <html lang>.
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { FC } from "react";

import { locales } from "@/shared/lib/locales";
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

// Site-wide metadata from `Meta.Common` in the messages: metadataBase, the app version, the default title, the icons and `noindex`.
export { generateMetadata } from "@/views/site-layout/metadata";

// One prerendered tree per locale. Cache Components require at least one value for every root param.
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

const RootLayout: FC<LayoutProps<"/[locale]">> = async (props) => {
  const { children } = props;
  // Resolved by src/shared/lib/i18n/request.ts from the [locale] segment; an unknown locale ends in notFound().
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    // suppressHydrationWarning: the theme script sets the class and color-scheme on <html> before React hydrates.
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/*
          Gives client components the locale, time zone and the `Pages` messages. Without `messages` the provider would
          serialize every message into the page, `Meta` included, which no client component reads.
        */}
        <NextIntlClientProvider messages={{ Pages: messages.Pages }}>
          <ThemeProvider>
            <SiteLayout>{children}</SiteLayout>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
