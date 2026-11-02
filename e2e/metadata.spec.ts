import { expect, test } from "./fixtures";

import { locales } from "@/shared/lib/locales";

import { version } from "../package.json";

// Localized <head>: title and description from the profile, canonical, hreflang for every locale + x-default.
const description =
  "I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js, most recently at Glovo, Sony PlayStation and EPAM.";

for (const locale of ["en", "ru"] as const) {
  test(`/${locale} has localized metadata and hreflang links`, async ({ page }) => {
    await page.goto(`/${locale}`);

    // Untranslated locales fall back to the English profile.
    await expect(page).toHaveTitle("Mikhail Aleksandrov — Senior Frontend Software Engineer, 8+ years");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", locale);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(`/${locale}`);

    const alternates = await page
      .locator("link[rel='alternate'][hreflang]")
      .evaluateAll((links) => links.map((l) => [l.getAttribute("hreflang"), new URL(l.getAttribute("href")!).pathname]));
    expect(Object.fromEntries(alternates)).toEqual({
      ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
      "x-default": "/",
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
});
