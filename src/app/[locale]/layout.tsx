import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { FC } from "react";

import { locales } from "@/shared/lib/locales";
import { SiteLayout } from "@/views/site-layout/SiteLayout";

import { ThemeProvider } from "../_providers/ThemeProvider";
import { fontVariables } from "../fonts";

import "../globals.css";

export { generateMetadata } from "@/views/site-layout/metadata";

export const generateStaticParams = () => locales.map((locale) => ({ locale }));

const RootLayout: FC<LayoutProps<"/[locale]">> = async (props) => {
  const { children } = props;
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
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
