import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const getSection = (page: Page) => page.getByRole("region", { name: "My top skills" });
const getRows = (page: Page) => getSection(page).getByRole("meter");

/** Different left edges of the rows, so the number of columns whatever the skills are. */
const countColumns = async (page: Page) => {
  const lefts = await getRows(page).evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().left));

  return new Set(lefts).size;
};

// My top skills: the skills marked `top` in the content files. The owner edits them, so the tests read properties, not names.
test("lists the marked skills from the highest level down", async ({ page }) => {
  await page.goto("/en");

  await expect(getSection(page).getByRole("heading", { level: 2, name: "My top skills" })).toBeVisible();
  await expect(getRows(page)).not.toHaveCount(0);

  const levels = await getRows(page).evaluateAll((rows) => rows.map((row) => Number(row.getAttribute("aria-valuenow"))));
  expect(levels).toEqual(levels.toSorted((a, b) => b - a));
});

test("describes every row to a screen reader", async ({ page }) => {
  await page.goto("/en");

  const level = await getRows(page).first().getAttribute("aria-valuenow");
  await expect(getRows(page).first()).toHaveAccessibleName(new RegExp(`: level ${level} of 10$`));
  await expect(getRows(page).first()).toHaveAttribute("aria-valuetext", `${level}/10`);
});

test("counts every skill in the link to the full list", async ({ page }) => {
  await page.goto("/de");

  const link = getSection(page).getByRole("link", { name: /^Show all \d+ skills$/ });
  await expect(link).toHaveAttribute("href", "/de/skills");

  const total = Number((await link.textContent())?.match(/\d+/)?.[0]);
  expect(total).toBeGreaterThan(await getRows(page).count());
});

test("styles the link as the primary pill", async ({ page }) => {
  await page.goto("/en");

  const link = getSection(page).getByRole("link", { name: /^Show all/ });
  await expect(link).toHaveCSS("height", "44px");
  await expect(link).toHaveCSS("text-decoration-line", "none");
});

test.describe("desktop layout", () => {
  test.skip(({ isMobile }) => isMobile, "the columns start at lg");

  test("spreads the rows over three columns and puts the link on the right", async ({ page }) => {
    await page.goto("/en");

    expect(await countColumns(page)).toBe(3);

    const sectionBox = await getSection(page).boundingBox();
    const linkBox = await getSection(page).getByRole("link", { name: /^Show all/ }).boundingBox();
    expect(linkBox!.x + linkBox!.width).toBeCloseTo(sectionBox!.x + sectionBox!.width, 0);
    expect(linkBox!.width).toBeLessThan(sectionBox!.width / 2);
  });

  test("lays a row out as name, bar and value", async ({ page }) => {
    await page.goto("/en");

    const row = getRows(page).first();
    const [name, bar, value] = await row.evaluate((element) =>
      [...element.children].map((child) => {
        const { x, width, height, top } = child.getBoundingClientRect();
        return { x, width, height, top };
      }),
    );

    expect(name.width).toBe(150);
    expect(value.width).toBe(44);
    expect(bar.height).toBe(10);
    expect(bar.top - name.top).toBeLessThan(name.height);
    expect(value.x).toBeGreaterThan(bar.x + bar.width);
  });

  test("keeps two columns at the narrowest desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/en");

    expect(await countColumns(page)).toBe(2);
  });
});

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("shows one column and stretches the link over the block", async ({ page }) => {
    await page.goto("/en");

    expect(await countColumns(page)).toBe(1);

    const sectionBox = await getSection(page).boundingBox();
    const linkBox = await getSection(page).getByRole("link", { name: /^Show all/ }).boundingBox();
    expect(linkBox!.width).toBe(sectionBox!.width);
  });

  test("keeps the bar and the value on one line below the name", async ({ page }) => {
    await page.goto("/en");

    const [name, bar, value] = await getRows(page)
      .first()
      .evaluate((element) =>
        [...element.children].map((child) => {
          const { top, bottom, height } = child.getBoundingClientRect();
          return { top, bottom, height };
        }),
      );

    expect(bar.height).toBe(8);
    expect(bar.top).toBeGreaterThanOrEqual(name.bottom);
    expect(value.top).toBeGreaterThanOrEqual(name.bottom);
    // Centered on the same line: the value's text is taller than the bar.
    expect((bar.top + bar.bottom) / 2).toBeCloseTo((value.top + value.bottom) / 2, 0);
    await expect(getRows(page).first().locator("span").last()).toHaveCSS("text-align", "right");
  });
});

for (const width of [390, 720, 1024, 1280]) {
  test(`does not widen the page at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en");

    await expect(getRows(page).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}
