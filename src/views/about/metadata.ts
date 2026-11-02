import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { getProfile } from "@/db/queries/home";
import { getLocaleAlternates } from "@/shared/lib/i18n/alternates";
import { locales } from "@/shared/lib/locales";

/** About page metadata in the page's language. The intro doubles as the description: it is the page's summary. */
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const [profile, t] = await Promise.all([getProfile(locale), getTranslations("About")]);

  const title = `${t("metaTitle")} — ${profile.name}`;
  const description = t("intro");
  const alternates = getLocaleAlternates(locale, "/about");

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      title,
      description,
      url: alternates.canonical,
      siteName: profile.name,
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
    },
  };
};
