import { expect, test } from "./fixtures";

import { locales } from "@/shared/lib/locales";

import { version } from "../package.json";
import { readPageMeta, readSiteMeta } from "./meta-content";

const pages = [
  { locale: "en", key: "Home", path: "" },
  { locale: "en", key: "About", path: "/about" },
  { locale: "en", key: "Experience", path: "/experience" },
  { locale: "en", key: "Skills", path: "/skills" },
  { locale: "ru", key: "Experience", path: "/experience" },
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

const appVersion = `${version}+abcdef0`;

test("the home page carries the app version", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator('meta[name="app-version"]')).toHaveAttribute("content", appVersion);
});

test.describe("404 page", () => {
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("carries the app version", async ({ page }) => {
    await page.goto("/en/no-such-page");

    await expect(page.locator('meta[name="app-version"]')).toHaveAttribute("content", appVersion);
  });

  test("has the default title from the content files", async ({ page }) => {
    const site = await readSiteMeta();
    await page.goto("/en/no-such-page");

    await expect(page).toHaveTitle(site.defaultTitle);
  });

  test("is closed to search engines while the site is hidden", async ({ page }) => {
    const site = await readSiteMeta();
    test.skip(!site.hiddenFromSearch, "the site is open: the 404 page keeps only Next's own noindex");
    await page.goto("/en/no-such-page");

    await expect(page.locator('meta[name="robots"][content*="nofollow"]')).toHaveAttribute("content", /noindex/);
  });
});

for (const path of ["", "/about", "/experience"]) {
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
    expect(response.status()).toBe(404);
    expect(await response.body()).toHaveLength(0);
  }
});
