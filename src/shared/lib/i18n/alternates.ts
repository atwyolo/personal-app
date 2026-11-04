import { type Locale, locales } from "@/shared/lib/locales";

export interface LocaleAlternates {
  canonical: string;
  languages: Record<Locale | "x-default", string>;
}

export const getLocaleAlternates = (locale: Locale, pathname = ""): LocaleAlternates => {
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${pathname}`])) as Record<Locale, string>;

  return {
    canonical: `/${locale}${pathname}`,
    languages: { ...languages, "x-default": pathname || "/" },
  };
};
