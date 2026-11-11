import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { type FC, Suspense } from "react";

import { NotFoundPage } from "@/views/not-found/NotFoundPage";
import { SiteLayout } from "@/views/site-layout/SiteLayout";

import { ThemeProvider } from "./_providers/ThemeProvider";
import { fontVariables } from "./fonts";

import "./globals.css";

export { generateMetadata } from "@/views/not-found/metadata";

const NotFoundDocument: FC = async () => {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={{ Pages: messages.Pages }}>
          <ThemeProvider>
            <SiteLayout>
              <NotFoundPage />
            </SiteLayout>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

const GlobalNotFound: FC = () => (
  <Suspense>
    <NotFoundDocument />
  </Suspense>
);

export default GlobalNotFound;
