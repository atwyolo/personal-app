import { expect, test } from "./fixtures";

import { locales } from "@/shared/lib/locales";

import { version } from "../package.json";
import { readPageMeta, readSiteMeta } from "./meta-content";

// Localized <head> from `Meta` in the messages files, compared with the files rather than with literals: editing a title,
// a description or an image later, or translating them, must not break the suite. `ru` falls back to English per field.
const pages = [
  { locale: "en", key: "Home", path: "" },
  { locale: "en", key: "About", path: "/about" },
  { locale: "en", key: "Experience", path: "/projects" },
  { locale: "en", key: "Skills", path: "/skills" },
  { locale: "ru", key: "Experience", path: "/projects" },
] as const;

for (const { locale, key, path } of pages) {
  test(`/${locale}${path} has its metadata from the messages files and hreflang links`, async ({ page }) => {
    const [meta, site] = await Promise.all([readPageMeta(key, locale), readSiteMeta(locale)]);
    await page.goto(`/${locale}${path}`);

    await expect(page).toHaveTitle(meta.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", meta.description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", meta.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", meta.description);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", site.siteName);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", locale);

    // No image anywhere means no tag at all, never one with an empty content.
    const image = meta.ogImageUrl ?? site.ogPlaceholderUrl;
    if (image) {
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", image);
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", meta.title);
    } else {
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    }

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(`/${locale}${path}`);

    const alternates = await page
      .locator("link[rel='alternate'][hreflang]")
      .evaluateAll((links) => links.map((l) => [l.getAttribute("hreflang"), new URL(l.getAttribute("href")!).pathname]));
    expect(Object.fromEntries(alternates)).toEqual({
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      "x-default": path || "/",
    });
  });
}

// The deployment check: the tag names the build. The Playwright web server builds with BUILD_COMMIT, see playwright.config.ts.
const appVersion = `${version}+abcdef0`;

test("the home page carries the app version", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator('meta[name="app-version"]')).toHaveAttribute("content", appVersion);
});

test.describe("404 page", () => {
  // The browser logs its own console error for any 404 document.
  test.use({ allowedConsoleErrors: [/status of 404/] });

  // In the DOM only: the 404 response is an error shell without the tag, and the page renders on the client.
  test("carries the app version", async ({ page }) => {
    await page.goto("/en/no-such-page");

    await expect(page.locator('meta[name="app-version"]')).toHaveAttribute("content", appVersion);
  });

  test("has the default title from the content files", async ({ page }) => {
    const site = await readSiteMeta();
    await page.goto("/en/no-such-page");

    await expect(page).toHaveTitle(site.defaultTitle);
  });

  // Next adds its own `noindex` to a 404 page, so only the hidden case is ours to check here.
  test("is closed to search engines while the site is hidden", async ({ page }) => {
    const site = await readSiteMeta();
    test.skip(!site.hiddenFromSearch, "the site is open: the 404 page keeps only Next's own noindex");
    await page.goto("/en/no-such-page");

    await expect(page.locator('meta[name="robots"][content*="nofollow"]')).toHaveAttribute("content", /noindex/);
  });
});

// Site-wide metadata from `Meta.Common`. Each test follows the files, so flipping the flag or uploading
// the icons later does not break the suite.
for (const path of ["", "/about", "/projects"]) {
  test(`/en${path} follows hiddenFromSearch`, async ({ page }) => {
    const site = await readSiteMeta();
    await page.goto(`/en${path}`);

    const robots = page.locator('meta[name="robots"]');
    if (site.hiddenFromSearch) {
      await expect(robots).toHaveAttribute("content", "noindex, nofollow");
    } else {
      await expect(robots).toHaveCount(0);
    }
  });
}

test("the icon links follow the content files", async ({ page }) => {
  const site = await readSiteMeta();
  await page.goto("/en");

  const icons = await page.locator('link[rel="icon"]').evaluateAll((links) => links.map((l) => l.getAttribute("href")));
  const expected = [site.iconIcoUrl, site.iconPngUrl, site.iconSvgUrl].filter((url) => url !== null);
  // No browser icon yet: exactly one empty icon. A browser asks the site root for /favicon.ico only when a page has
  // no icon link at all, so the tag is the proof. Headless Chromium never requests a favicon, so watching the network
  // here would pass with or without the tag.
  expect(icons).toEqual(expected.length > 0 ? expected : ["data:,"]);

  const apple = page.locator('link[rel="apple-touch-icon"]');
  if (site.appleTouchIconUrl) {
    await expect(apple).toHaveAttribute("href", site.appleTouchIconUrl);
  } else {
    await expect(apple).toHaveCount(0);
  }
});

test("/favicon.ico follows the content files", async ({ request }) => {
  const site = await readSiteMeta();
  const response = await request.get("/favicon.ico", { maxRedirects: 0 });

  if (site.iconIcoUrl) {
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(site.iconIcoUrl);
  } else {
    // An empty body tells the handler's 404 from Next's own 404 page, which a missing route would return.
    expect(response.status()).toBe(404);
    expect(await response.body()).toHaveLength(0);
  }
});
