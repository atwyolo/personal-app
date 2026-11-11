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

  test("sets a session cookie on a link to another language, not only on a pick", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();

    await page.goto("/ru");

    const cookie = (await context.cookies()).find((c) => c.name === "NEXT_LOCALE");
    expect(cookie?.value).toBe("ru");
    expect(cookie?.expires).toBe(-1);
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
    expect(cookie!.expires).toBe(-1);

    await page.goto("/");
    await expect(page).toHaveURL(/\/de$/);
  });
});

