import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { FC } from "react";

import { locales } from "@/shared/lib/locales";
import { SiteLayout } from "@/views/site-layout/SiteLayout";

import { ThemeProvider } from "../_providers/ThemeProvider";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export { generateMetadata } from "@/views/site-layout/metadata";

export const generateStaticParams = () => locales.map((locale) => ({ locale }));

const RootLayout: FC<LayoutProps<"/[locale]">> = async (props) => {
  const { children } = props;
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
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
