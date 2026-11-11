import type { Metadata, Viewport } from "next";

import type { LocaleAlternates } from "./i18n/alternates";
import { type Locale, locales } from "./locales";
import { themeColors } from "./theme-colors";

export interface PageMetadataInput {
  title: string;
  description: string;
  ogImageUrl: string | null;
}

export interface BuildPageMetadataParams {
  page: PageMetadataInput;
  site: { siteName: string; ogPlaceholderUrl: string | null };
  locale: Locale;
  alternates: LocaleAlternates;
}

export const buildPageMetadata = (params: BuildPageMetadataParams): Metadata => {
  const { page, site, locale, alternates } = params;
  const { title, description } = page;
  const imageUrl = page.ogImageUrl ?? site.ogPlaceholderUrl;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      title,
      description,
      url: alternates.canonical,
      siteName: site.siteName,
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: title }] } : {}),
    },
  };
};

export interface BuildSiteMetadataParams {
  defaultTitle: string;
  iconIcoUrl: string | null;
  iconSvgUrl: string | null;
  iconPngUrl: string | null;
  appleTouchIconUrl: string | null;
  hiddenFromSearch: boolean;
}

const EMPTY_ICON = "data:,";

export const buildSiteMetadata = (params: BuildSiteMetadataParams): Metadata => {
  const { defaultTitle, iconIcoUrl, iconSvgUrl, iconPngUrl, appleTouchIconUrl, hiddenFromSearch } = params;

  const browserIcons = [
    iconIcoUrl && { url: iconIcoUrl, sizes: "32x32" },
    iconPngUrl && { url: iconPngUrl, type: "image/png", sizes: "96x96" },
    iconSvgUrl && { url: iconSvgUrl, type: "image/svg+xml" },
  ].filter((icon) => !!icon);

  return {
    title: defaultTitle,
    icons: {
      icon: browserIcons.length > 0 ? browserIcons : EMPTY_ICON,
      ...(appleTouchIconUrl ? { apple: [{ url: appleTouchIconUrl, sizes: "180x180" }] } : {}),
    },
    ...(hiddenFromSearch ? { robots: { index: false, follow: false } } : {}),
  };
};

export const buildSiteViewport = (): Viewport => ({
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
});
