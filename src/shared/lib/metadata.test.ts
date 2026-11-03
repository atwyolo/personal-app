import { describe, expect, it } from "vitest";

import { getLocaleAlternates } from "./i18n/alternates";
import { locales } from "./locales";
import { buildPageMetadata, buildSiteMetadata } from "./metadata";

const alternates = getLocaleAlternates("ru", "/projects");
const page = { title: "Projects — M. A.", description: "D", ogImageUrl: null };
const site = { siteName: "M. A.", ogPlaceholderUrl: null };
const placeholder = "https://blob.example/og-placeholder.png";
const ownImage = "https://blob.example/og-projects.png";

describe("buildPageMetadata", () => {
  it("shows the stored title and description unchanged", () => {
    const metadata = buildPageMetadata({ page, site, locale: "ru", alternates });

    expect(metadata.title).toBe("Projects — M. A.");
    expect(metadata.description).toBe("D");
  });

  it("passes the alternates through", () => {
    const metadata = buildPageMetadata({ page, site, locale: "ru", alternates });

    expect(metadata.alternates).toEqual(alternates);
  });

  it("builds the whole Open Graph object, because a page's openGraph replaces the layout's", () => {
    const metadata = buildPageMetadata({ page, site, locale: "ru", alternates });

    expect(metadata.openGraph).toEqual({
      type: "website",
      title: "Projects — M. A.",
      description: "D",
      url: "/ru/projects",
      siteName: "M. A.",
      locale: "ru",
      alternateLocale: locales.filter((l) => l !== "ru"),
    });
  });

  it("has no images when neither the page nor the site has one", () => {
    const metadata = buildPageMetadata({ page, site, locale: "ru", alternates });

    expect(metadata.openGraph).not.toHaveProperty("images");
  });

  it("falls back to the site's placeholder, with the title as its alt", () => {
    const metadata = buildPageMetadata({
      page,
      site: { ...site, ogPlaceholderUrl: placeholder },
      locale: "ru",
      alternates,
    });

    expect(metadata.openGraph).toHaveProperty("images", [{ url: placeholder, alt: "Projects — M. A." }]);
  });

  it("prefers the page's own image over the placeholder", () => {
    const metadata = buildPageMetadata({
      page: { ...page, ogImageUrl: ownImage },
      site: { ...site, ogPlaceholderUrl: placeholder },
      locale: "ru",
      alternates,
    });

    expect(metadata.openGraph).toHaveProperty("images", [{ url: ownImage, alt: "Projects — M. A." }]);
  });

  it("describes a post as an article, and every other page as a website", () => {
    expect(buildPageMetadata({ page, site, locale: "ru", alternates, type: "article" }).openGraph).toHaveProperty(
      "type",
      "article",
    );
    expect(buildPageMetadata({ page, site, locale: "ru", alternates }).openGraph).toHaveProperty("type", "website");
  });

  it("leaves robots to the layout", () => {
    const metadata = buildPageMetadata({ page, site, locale: "ru", alternates });

    expect(metadata).not.toHaveProperty("robots");
  });
});

describe("buildSiteMetadata", () => {
  const noIcons = {
    defaultTitle: "M. A.",
    iconIcoUrl: null,
    iconSvgUrl: null,
    iconPngUrl: null,
    appleTouchIconUrl: null,
    hiddenFromSearch: false,
  };
  const ico = "https://blob.example/favicon.ico";
  const svg = "https://blob.example/icon.svg";
  const png = "https://blob.example/icon-96.png";
  const apple = "https://blob.example/apple-touch-icon.png";

  it("gives pages without a title the default one, with no template around full titles", () => {
    const metadata = buildSiteMetadata(noIcons);

    // A layout's string title is the default of its child segments, as `title.default` would be.
    expect(metadata.title).toBe("M. A.");
  });

  it("closes every page to search engines while the site is hidden", () => {
    const metadata = buildSiteMetadata({ ...noIcons, hiddenFromSearch: true });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("sets no robots once the site is open", () => {
    const metadata = buildSiteMetadata(noIcons);

    expect(metadata).not.toHaveProperty("robots");
  });

  it("emits the empty icon while no browser icon is set, so the browser does not request /favicon.ico", () => {
    const metadata = buildSiteMetadata(noIcons);

    expect(metadata.icons).toEqual({ icon: "data:," });
  });

  it("keeps the apple icon next to the empty one", () => {
    const metadata = buildSiteMetadata({ ...noIcons, appleTouchIconUrl: apple });

    expect(metadata.icons).toEqual({ icon: "data:,", apple: [{ url: apple, sizes: "180x180" }] });
  });

  it("drops the empty icon as soon as one browser icon is set", () => {
    const metadata = buildSiteMetadata({ ...noIcons, iconSvgUrl: svg });

    expect(metadata.icons).toEqual({ icon: [{ url: svg, type: "image/svg+xml" }] });
  });

  it("lists every icon in the order that lets each browser pick its format", () => {
    const metadata = buildSiteMetadata({
      ...noIcons,
      iconIcoUrl: ico,
      iconSvgUrl: svg,
      iconPngUrl: png,
      appleTouchIconUrl: apple,
    });

    expect(metadata.icons).toEqual({
      // `sizes="32x32"`, not "any", on the .ico: with "any" Chromium prefers it over the SVG.
      icon: [
        { url: ico, sizes: "32x32" },
        { url: png, type: "image/png", sizes: "96x96" },
        { url: svg, type: "image/svg+xml" },
      ],
      apple: [{ url: apple, sizes: "180x180" }],
    });
  });
});
