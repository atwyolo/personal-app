import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const colorOf = (page: Page, className: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("i");
    probe.className = name;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();

    return color;
  }, className);

const brandColor = (page: Page) => colorOf(page, "text-brand");

const expectAccent = async (item: Locator, label: string, hint: string, brand: string) => {
  await expect(item.getByText(label, { exact: true })).toHaveCSS("color", brand);
  await expect(item.getByText(hint, { exact: true })).toHaveCSS("color", brand);
  await expect(item.locator("svg")).toHaveCSS("color", brand);
};

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ page }) => {
      await page.goto("/en");
    });

    test("the selected locale is in the accent color as a whole", async ({ page }) => {
      await page.getByRole("button", { name: /EN/ }).click();

      const item = page.getByRole("menuitemradio", { name: /English/ });
      await expectAccent(item, "English", "EN", await brandColor(page));
    });

    test("it stays that way under the pointer", async ({ page }) => {
      await page.getByRole("button", { name: /EN/ }).click();

      const item = page.getByRole("menuitemradio", { name: /English/ });
      await item.hover();

      await expect(item).toBeFocused();
      await expectAccent(item, "English", "EN", await brandColor(page));
    });

    test("its small code stays readable under the pointer, at 4.5:1 or more", async ({ page }) => {
      await page.getByRole("button", { name: /EN/ }).click();
      const item = page.getByRole("menuitemradio", { name: /English/ });
      await item.hover();
      await expect(item).toBeFocused();

      const ratio = await item.evaluate((element) => {
        const hint = Array.from(element.querySelectorAll("span")).find((span) => span.textContent === "EN");
        if (!hint) throw new Error("no hint");

        const luminance = (color: string) => {
          const [red, green, blue] = (color.match(/[\d.]+/g) ?? []).map((value) => {
            const channel = Number(value) / 255;

            return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });

          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        const [lighter, darker] = [
          luminance(getComputedStyle(hint).color),
          luminance(getComputedStyle(element).backgroundColor),
        ].sort((a, b) => b - a);

        return (lighter + 0.05) / (darker + 0.05);
      });

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test("other locales keep the muted code", async ({ page }) => {
      await page.getByRole("button", { name: /EN/ }).click();

      const hint = page.getByRole("menuitemradio", { name: /Deutsch/ }).getByText("DE", { exact: true });
      await expect(hint).toHaveCSS("color", await colorOf(page, "text-muted-foreground"));
    });

    test("a selected System theme is in the accent color as a whole", async ({ page }) => {
      await page.getByRole("button", { name: /theme/i }).click();

      const item = page.getByRole("menuitemradio", { name: /System/ });
      await expectAccent(item, "System", `now ${colorScheme}`, await brandColor(page));
    });
  });
}
