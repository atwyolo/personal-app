import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import type { Locale } from "@/shared/lib/locales";

import { version } from "../package.json";
import { messagesFor } from "./messages";
import { readNotFoundMeta } from "./meta-content";

test.use({ allowedConsoleErrors: [/status of 404/] });

const langOf = (page: Page, role: "main" | "banner") =>
  page.getByRole(role).evaluate((element) => element.closest("[lang]")?.getAttribute("lang"));

const expectNotFoundPage = async (page: Page, locale: Locale) => {
  const t = messagesFor(locale);
  const main = page.getByRole("main");

  expect(await langOf(page, "main")).toBe(locale);
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(t("Pages.NotFound.title"));
  await expect(main.getByText(t("Pages.NotFound.label"), { exact: true })).toBeVisible();
  await expect(main.getByText(t("Pages.NotFound.text"), { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: t("Pages.NotFound.home") })).toHaveAttribute("href", `/${locale}`);
};

test("an unknown path inside a locale answers 404 with the page", async ({ page }) => {
  const response = await page.goto("/en/does-not-exist");

  expect(response?.status()).toBe(404);
  await expectNotFoundPage(page, "en");
});

for (const locale of ["ru", "de"] as const) {
  test(`speaks the language of /${locale}`, async ({ page }) => {
    const response = await page.goto(`/${locale}/does/not/exist`);

    expect(response?.status()).toBe(404);
    await expectNotFoundPage(page, locale);
    expect(await langOf(page, "banner")).toBe(locale);
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("is rendered on the server, header included", async ({ page }) => {
    const response = await page.goto("/ru/does-not-exist");

    expect(response?.status()).toBe(404);
    await expectNotFoundPage(page, "ru");
    await expect(page.getByRole("banner")).toBeVisible();
  });
});

test("an unknown locale is redirected under a real one and ends in a 404", async ({ page }) => {
  const response = await page.goto("/xx");

  await expect(page).toHaveURL(/\/en\/xx$/);
  expect(response?.status()).toBe(404);
});

test.describe("a path outside the locales", () => {
  test.use({ locale: "en-US" });

  test("ends in the 404 of the detected language", async ({ page }) => {
    const response = await page.goto("/wp-login.php");

    await expect(page).toHaveURL(/\/en\/wp-login\.php$/);
    expect(response?.status()).toBe(404);
    await expectNotFoundPage(page, "en");
  });

  test("follows the remembered language", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "ru", url: baseURL! }]);
    const response = await page.goto("/wp-login.php");

    await expect(page).toHaveURL(/\/ru\/wp-login\.php$/);
    expect(response?.status()).toBe(404);
    await expectNotFoundPage(page, "ru");
  });
});

test("leads home in the same language", async ({ page }) => {
  await page.goto("/ru/does-not-exist");

  await page.getByRole("link", { name: messagesFor("ru")("Pages.NotFound.home") }).click();

  await expect(page).toHaveURL(/\/ru$/);
});

test("has its title from the content files and stays out of search", async ({ page }) => {
  const meta = await readNotFoundMeta();
  await page.goto("/en/does-not-exist");

  await expect(page).toHaveTitle(meta.title);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("carries the app version", async ({ page }) => {
  await page.goto("/en/does-not-exist");

  await expect(page.locator('meta[name="app-version"]')).toHaveAttribute("content", `${version}+abcdef0`);
});

test("files the Proxy must not touch are not redirected to a locale", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/favicon.ico"]) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.headers().location ?? "", path).not.toMatch(/^\/[a-z]{2}\//);
  }
});

test.describe("look", () => {
  test("has one main and one h1, and hides the big number from assistive technology", async ({ page }) => {
    await page.goto("/en/does-not-exist");

    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("[data-not-found-code]")).toHaveAttribute("aria-hidden", "true");
  });

  test("centers the content in the space under the header", async ({ page }) => {
    await page.goto("/en/does-not-exist");

    const viewport = page.viewportSize()!;
    const header = (await page.getByRole("banner").boundingBox())!;
    const main = (await page.getByRole("main").boundingBox())!;
    const heading = (await page.getByRole("heading", { level: 1 }).boundingBox())!;

    expect(main.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(main.y + main.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(Math.abs(heading.x + heading.width / 2 - viewport.width / 2)).toBeLessThan(2);
  });

  test("outlines the focused button with 2 px of the accent", async ({ page }) => {
    await page.goto("/en/does-not-exist");

    const button = page.getByRole("link", { name: messagesFor("en")("Pages.NotFound.home") });
    await button.focus();

    await expect(button).toHaveCSS("outline-width", "2px");
    await expect(button).toHaveCSS("outline-offset", "4px");
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test("stretches the button over the content width and does not scroll sideways", async ({ page }) => {
      await page.goto("/de/does-not-exist");

      const button = (await page.getByRole("link", { name: messagesFor("de")("Pages.NotFound.home") }).boundingBox())!;
      const width = await page.evaluate(() => document.documentElement.scrollWidth);

      expect(button.width).toBeGreaterThanOrEqual(320 - 2 * 20 - 1);
      expect(width).toBeLessThanOrEqual(320);
    });
  });
});
