import { expect, test } from "./fixtures";
import { messagesFor } from "./messages";

import { locales } from "@/shared/lib/locales";

test.describe("locale detection on /", () => {
  test("redirects to the browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ru-RU" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/ru$/);
    await context.close();
  });

  test("falls back to English for an unsupported browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "it-IT" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await context.close();
  });

  test("prefers the locale cookie over the browser language", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ locale: "ru-RU" });
    await context.addCookies([{ name: "NEXT_LOCALE", value: "de", url: baseURL! }]);
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/de$/);
    await context.close();
  });
});

test.describe("localized pages", () => {
  for (const locale of locales) {
    test(`/${locale} renders with lang="${locale}"`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);

      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

});

test.describe("unknown paths", () => {
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("an unknown path inside a locale is a 404", async ({ page }) => {
    const response = await page.goto("/en/does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("an unknown locale is redirected under a real one and ends in a 404", async ({ page }) => {
    const response = await page.goto("/xx");

    await expect(page).toHaveURL(/\/en\/xx$/);
    expect(response?.status()).toBe(404);
  });
});

test.describe("locale menu", () => {
  test.use({ locale: "en-US" });

  test("opens the same page in the picked locale and remembers the choice", async ({ page, context }) => {
    await page.goto("/en");

    await page.getByRole("banner").getByRole("button", { name: "Language" }).click();
    await page.getByRole("menu", { name: "Language" }).getByRole("menuitemradio", { name: /Deutsch/ }).click();

    await expect(page).toHaveURL(/\/de$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.getByRole("banner").getByRole("button", { name: messagesFor("de")("Pages.Common.LocaleMenu.label") })).toHaveText("DE");

    await expect.poll(async () => (await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("de");
    const cookie = (await context.cookies()).find((c) => c.name === "NEXT_LOCALE");
    expect(cookie!.expires * 1000 - Date.now()).toBeGreaterThan(360 * 24 * 60 * 60 * 1000);

    await page.goto("/");
    await expect(page).toHaveURL(/\/de$/);
  });
});

