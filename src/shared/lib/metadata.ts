import type { Metadata } from "next";

import type { LocaleAlternates } from "./i18n/alternates";
import { type Locale, locales } from "./locales";

/**
 * Builders of Next's `Metadata` from `Meta` in the messages. Pure functions over plain data: `shared` does not import `content`,
 * and the query results match these input types structurally.
 */

export interface PageMetadataInput {
  /** The full title, shown exactly as stored. */
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

/**
 * A page's metadata. `openGraph` is complete here because a page's `openGraph` replaces the layout's as a whole,
 * so shared fields such as `siteName` cannot live in the layout. `robots` belongs to the layout and is never set here.
 */
export const buildPageMetadata = (params: BuildPageMetadataParams): Metadata => {
  const { page, site, locale, alternates } = params;
  const { title, description } = page;
  // The Data Model has no alt-text fields: the preview image is described by the page's title.
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

/** An empty icon: the browser has its answer and does not request `/favicon.ico`, so no 404 reaches the console. */
const EMPTY_ICON = "data:,";

/**
 * The site-wide part, returned by the root layout. Pages set no `robots` and no `icons`, so these reach every page;
 * a layout's string `title` is the default of every child page without one (the 404 page), as `title.default` would be;
 * Next's types allow `default` only together with a `template`, and stored titles are full text, so there is no template.
 */
export const buildSiteMetadata = (params: BuildSiteMetadataParams): Metadata => {
  const { defaultTitle, iconIcoUrl, iconSvgUrl, iconPngUrl, appleTouchIconUrl, hiddenFromSearch } = params;

  // `.ico` first with a concrete size, then PNG, then SVG: with `sizes="any"` on the `.ico` Chromium would prefer it over the SVG.
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
