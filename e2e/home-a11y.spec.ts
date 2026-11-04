import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const RING = { light: "rgb(35, 71, 232)", dark: "rgb(198, 244, 50)" };

const tabThroughPage = async (page: Page) => {
  const stops = [];

  for (let press = 0; press < 80; press += 1) {
    await page.keyboard.press("Tab");

    const stop = await page.evaluate(() => {
      const element = document.activeElement;

      if (!element || element === document.body) return null;

      for (const transition of element.getAnimations()) transition.finish();

      const style = getComputedStyle(element);

      return {
        name: (element.getAttribute("aria-label") ?? element.textContent ?? "").trim(),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
      };
    });

    if (!stop) break;
    stops.push(stop);
  }

  return stops;
};

test.describe("keyboard focus", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`shows the same 3 px ring on every stop, ${colorScheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/en");

      const color = RING[colorScheme];
      const stops = await tabThroughPage(page);

      const hasRing = (stop: (typeof stops)[number]) => {
        const outline =
          stop.outlineStyle === "solid" && stop.outlineWidth === "3px" && stop.outlineColor === color;
        const shadow = stop.boxShadow.includes(`${color} 0px 0px 0px 3px`);

        return outline !== shadow;
      };

      expect(stops.length).toBeGreaterThan(10);
      expect(stops.filter((stop) => !hasRing(stop)).map((stop) => stop.name)).toEqual([]);
    });
  }

  test.describe("in forced colors mode", () => {
    test.use({ forcedColors: "active" });

    test("keeps an outline on every stop, because the browser drops box shadows there", async ({ page }) => {
      await page.goto("/en");

      const stops = await tabThroughPage(page);

      expect(stops.length).toBeGreaterThan(10);
      expect(stops.filter((stop) => stop.outlineStyle !== "solid").map((stop) => stop.name)).toEqual([]);
    });
  });
});

test("keeps the text of every contact button at 4.5:1 or more", async ({ page }) => {
  await page.goto("/en");

  const buttons = await page.locator("main ul[aria-label] a").evaluateAll((links) => {
    const luminance = (color: string) => {
      const [red, green, blue] = (color.match(/[\d.]+/g) ?? []).map((value) => {
        const channel = Number(value) / 255;

        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });

      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    return links.map((link) => {
      const { color, backgroundColor } = getComputedStyle(link);
      const [lighter, darker] = [luminance(color), luminance(backgroundColor)].sort((a, b) => b - a);

      return { name: link.getAttribute("aria-label"), ratio: (lighter + 0.05) / (darker + 0.05) };
    });
  });

  expect(buttons.length).toBeGreaterThan(0);
  expect(buttons.filter((button) => button.ratio < 4.5)).toEqual([]);
});

test("keeps the visible text inside the accessible name of every control", async ({ page }) => {
  await page.goto("/en");

  const controls = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("a[aria-label], button[aria-label]"))
      .filter((control) => control.getClientRects().length > 0)
      .map((control) => ({
        label: control.getAttribute("aria-label") ?? "",
        visible: (control.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
  );

  const withText = controls.filter((control) => control.visible);

  expect(withText.length).toBeGreaterThan(0);
  expect(withText.filter(({ label, visible }) => !label.toLowerCase().includes(visible.toLowerCase()))).toEqual([]);
});
