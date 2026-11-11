import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { messagesFor } from "./messages";

import type { Locale } from "@/shared/lib/locales";

test.use({ allowedConsoleErrors: [/e2e: \w+ broken/] });

const breakOnce = (page: Page, api: "ResizeObserver" | "MutationObserver") =>
  page.addInitScript((name) => {
    if (sessionStorage.getItem("e2e-broken")) return;
    sessionStorage.setItem("e2e-broken", name);
    Object.defineProperty(window, name, {
      configurable: true,
      value: class {
        constructor() {
          throw new Error(`e2e: ${name} broken`);
        }
      },
    });
  }, api);

const errorTexts = (locale: Locale) => {
  const t = messagesFor(locale);

  return { title: t("Pages.Error.title"), metaTitle: t("Pages.Error.metaTitle"), reload: t("Pages.Error.reload") };
};

const expectNoSidewaysScroll = async (page: Page) => {
  const fit = await page.evaluate(() => {
    const heading = document.querySelector("h1")!;
    const button = document.querySelector("[data-error-page] button")!;

    return {
      page: document.documentElement.scrollWidth <= window.innerWidth,
      heading: heading.scrollWidth <= heading.clientWidth && heading.getBoundingClientRect().right <= window.innerWidth,
      button: button.getBoundingClientRect().right <= window.innerWidth,
    };
  });

  expect(fit).toEqual({ page: true, heading: true, button: true });
};

test.describe("an error inside a page", () => {
  test("shows the 500 page without the header", async ({ page }) => {
    await breakOnce(page, "ResizeObserver");
    await page.goto("/en/skills");

    const texts = errorTexts("en");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(page.locator("main[data-error-page], [data-error-page] main")).toBeVisible();
    await expect(heading).toHaveText(texts.title);
    await expect(heading).toBeFocused();
    await expect(page.locator("[data-site-header]")).toHaveCount(1);
    await expect(page.locator("[data-site-header]")).toBeHidden();
    await expect(page.locator("[data-status-code] > *")).toHaveText(["5", "0", ""]);
    await expect(page.getByText(messagesFor("en")("Pages.Error.errorId"))).toHaveCount(0);
    await expect(page).toHaveTitle(texts.metaTitle);
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  });

  test("speaks the language of the URL", async ({ page }) => {
    await breakOnce(page, "ResizeObserver");
    await page.goto("/ru/skills");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(errorTexts("ru").title);
  });

  test("reloads the page and brings the header back", async ({ page }) => {
    await breakOnce(page, "ResizeObserver");
    await page.goto("/en/skills");

    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: errorTexts("en").reload }).click()]);

    await expect(page.locator("[data-error-page]")).toHaveCount(0);
    await expect(page.locator("[data-site-header]")).toBeVisible();
    await expect(page).toHaveURL(/\/en\/skills$/);
  });

  for (const locale of ["de", "pl"] as const) {
    test(`does not scroll sideways on a 320 px phone in ${locale}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await breakOnce(page, "ResizeObserver");
      await page.goto(`/${locale}/skills`);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(errorTexts(locale).title);
      await expectNoSidewaysScroll(page);
    });
  }
});

test.describe("an error in the root layout", () => {
  test("shows the 500 page in the URL's language without any header", async ({ page }) => {
    await breakOnce(page, "MutationObserver");
    await page.goto("/de/about");

    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(errorTexts("de").title);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.locator("header")).toHaveCount(0);
    await expect(page).toHaveTitle(errorTexts("de").metaTitle);
  });

  test.describe("with a stored dark theme on a light system", () => {
    test.use({ colorScheme: "light" });

    test("keeps the visitor's theme", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("theme", "dark"));
      await breakOnce(page, "MutationObserver");
      await page.goto("/en");

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(errorTexts("en").title);
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    });
  });

  test("does not scroll sideways on a 320 px phone in pl", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await breakOnce(page, "MutationObserver");
    await page.goto("/pl");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(errorTexts("pl").title);
    await expectNoSidewaysScroll(page);
  });
});
