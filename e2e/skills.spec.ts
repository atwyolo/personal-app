import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { messagesFor } from "./messages";

const rows = (page: Page) => page.getByRole("main").getByRole("meter").filter({ visible: true });
const field = (page: Page) => page.getByRole("searchbox", { name: "Search skills" }).filter({ visible: true });
const count = (page: Page) => page.getByRole("status").filter({ visible: true });
const chips = (page: Page) => page.getByRole("group", { name: "Domain" }).filter({ visible: true }).getByRole("button");

const rowNames = (page: Page) =>
  rows(page).evaluateAll((meters) => meters.map((m) => m.getAttribute("aria-label")!.replace(/: level \d+ of 10$/, "")));

const panel = (page: Page) => page.locator("[data-filter-panel]").filter({ visible: true });
const chipRow = (page: Page) => page.locator("[data-scroll-fade]").filter({ visible: true });
const HEADER = 64;
const bottom = (box: { y: number; height: number } | null) => Math.round(box!.y + box!.height);

const scrollBy = async (page: Page, dy: number) => {
  await page.evaluate((y) => window.scrollBy(0, y), dy);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
};

const openHydrated = async (page: Page, path = "/en/skills") => {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-revealed", "");
};

const countContrast = (chip: ReturnType<typeof chips>) =>
  chip.evaluate((button) => {
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const count = button.querySelector("span")!;
    const [r, g, b] = rgb(getComputedStyle(count).color);
    const alpha = Number(getComputedStyle(count).opacity) * (rgb(getComputedStyle(count).color)[3] ?? 1);
    let element: Element | null = button;
    let background = rgb(getComputedStyle(element).backgroundColor);
    while ((background[3] ?? 1) === 0 && element.parentElement) {
      element = element.parentElement;
      background = rgb(getComputedStyle(element).backgroundColor);
    }
    const fg = [r, g, b].map((c, i) => c * alpha + background[i] * (1 - alpha));
    const luminance = (c: number[]) =>
      c
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const [hi, lo] = [luminance(fg), luminance(background)].sort((x, y) => y - x);

    return (hi + 0.05) / (lo + 0.05);
  });

test.describe("content", () => {
  test("shows the Back link, the title and the intro, and no extra labels", async ({ page }) => {
    await page.goto("/en/skills");

    await expect(page.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/en");
    await expect(page.getByRole("heading", { level: 1, name: "Skills" })).toBeVisible();
    await expect(page.getByText("Everything I work with, rated from 1 to 10. Search or filter by domain.")).toBeVisible();
    await expect(page.getByRole("main").getByText("Skills", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("main").getByText("All skills", { exact: true })).toHaveCount(0);
  });

  test("lists every skill from the highest level down and counts them", async ({ page }) => {
    await page.goto("/en/skills");

    const total = await rows(page).count();
    expect(total).toBeGreaterThan(0);
    await expect(count(page)).toHaveText(`${total} skills`);
    await expect(count(page)).toHaveAttribute("aria-live", "polite");

    const levels = await rows(page).evaluateAll((meters) => meters.map((m) => Number(m.getAttribute("aria-valuenow"))));
    expect(levels).toEqual(levels.toSorted((a, b) => b - a));
  });

  test("puts the search in a search landmark", async ({ page }) => {
    await page.goto("/en/skills");

    await expect(page.getByRole("search").getByRole("searchbox", { name: "Search skills" })).toBeVisible();
  });

  test("is where Home's link to all skills leads, with the same total", async ({ page }) => {
    await openHydrated(page, "/en");
    const link = page.getByRole("link", { name: /^Show all \d+ skills$/ });
    const total = Number((await link.textContent())!.match(/\d+/)![0]);

    await link.click();
    await page.waitForURL("**/en/skills");

    await expect(rows(page)).toHaveCount(total);
  });

  test("falls back to English in a locale without translations", async ({ page }) => {
    const t = messagesFor("ru");
    await page.goto("/ru/skills");

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { level: 1, name: t("Pages.Skills.title") })).toBeVisible();
    const allChip = page.getByRole("group", { name: t("Pages.Skills.domain") }).filter({ visible: true }).getByRole("button").first();
    await expect(allChip).toHaveText(new RegExp(`^${t("Pages.Skills.all")} \\d+$`));
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("still lists every skill", async ({ page }) => {
      await page.goto("/en/skills");

      await expect(rows(page).first()).toBeVisible();
      await expect(count(page)).toHaveText(`${await rows(page).count()} skills`);
    });
  });
});

test("shows the focus of the search in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/en/skills");

  await field(page).focus();

  await expect(field(page)).not.toHaveCSS("outline-style", "none");
});

test.describe("filters", () => {
  test("filters by the query only after typing pauses, and a cleared field shows everything", async ({ page }) => {
    await openHydrated(page);
    const all = await rowNames(page);
    const query = all[0].slice(0, 3);

    await field(page).pressSequentially(query);
    expect(await rows(page).count()).toBe(all.length);

    await expect
      .poll(async () => (await rowNames(page)).every((name) => name.toLowerCase().includes(query.toLowerCase())))
      .toBe(true);
    const shown = await rows(page).count();
    await expect(count(page)).toHaveText(
      shown === all.length ? `${all.length} skills` : `${shown} of ${all.length}`,
    );

    await field(page).clear();
    await expect(rows(page)).toHaveCount(all.length);
    await expect(count(page)).toHaveText(`${all.length} skills`);
  });

  test("filters by a domain at once, and All restores the list", async ({ page }) => {
    await openHydrated(page);
    const total = await rows(page).count();
    const domain = chips(page).nth(1);
    const domainCount = Number((await domain.textContent())!.match(/\d+$/)![0]);

    await domain.click();
    await expect(domain).toHaveAttribute("aria-pressed", "true");
    await expect(rows(page)).toHaveCount(domainCount);
    await expect(count(page)).toHaveText(`${domainCount} of ${total}`);

    await chips(page).first().click();
    await expect(rows(page)).toHaveCount(total);
  });

  test("names the query when nothing matches", async ({ page }) => {
    await openHydrated(page);
    const total = await rows(page).count();

    await field(page).fill("zzzzzz");

    await expect(page.getByText("No skills match “zzzzzz”.")).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(count(page)).toHaveText(`0 of ${total}`);
  });
});

test.describe("leaving and coming back", () => {
  test.skip(({ isMobile }) => isMobile, "the header links are in the menu on phones");

  test("starts over with an empty search and the full list", async ({ page }) => {
    await openHydrated(page);
    const total = await rows(page).count();
    await chips(page).nth(1).click();
    await field(page).fill("zzzzzz");
    await expect(rows(page)).toHaveCount(0);

    await page.getByRole("banner").getByRole("link", { name: "Home" }).click();
    await page.waitForURL("**/en");
    await page.getByRole("banner").getByRole("link", { name: "Skills" }).click();
    await page.waitForURL("**/en/skills");

    await expect(field(page)).toHaveValue("");
    await expect(chips(page).first()).toHaveAttribute("aria-pressed", "true");
    await expect(rows(page)).toHaveCount(total);
    await expect(count(page)).toHaveText(`${total} skills`);
  });
});

test.describe("phone layout", () => {
  test.skip(({ isMobile }) => !isMobile, "phones only");
  test.use({ viewport: { width: 360, height: 780 } });

  test("keeps the search text at 16 px, so iOS does not zoom in", async ({ page }) => {
    await page.goto("/en/skills");

    await expect(field(page)).toHaveCSS("font-size", "16px");
  });

  test("wraps a long query in the empty state instead of widening the page", async ({ page }) => {
    await openHydrated(page);

    await field(page).fill("x".repeat(80));
    await expect(page.getByText(/^No skills match/)).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test("fits 360 px: no sideways scroll, the chips row inside, the name and the level on one line", async ({ page }) => {
    await page.goto("/en/skills");

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    const row = (await chipRow(page).boundingBox())!;
    expect(row.x).toBeGreaterThanOrEqual(0);
    expect(row.x + row.width).toBeLessThanOrEqual(360);

    const skill = rows(page).first();
    const name = await skill.locator("span").first().boundingBox();
    const level = await skill.locator("span").last().boundingBox();
    expect(Math.abs(name!.y + name!.height / 2 - (level!.y + level!.height / 2))).toBeLessThan(2);
  });

  test("puts the chips in one swipeable row that shows there is more", async ({ page }) => {
    await openHydrated(page);

    const tops = await chips(page).evaluateAll((all) => all.map((c) => Math.round(c.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    await expect(chipRow(page)).toHaveAttribute("data-fade-end", "");
    await expect(chipRow(page)).not.toHaveAttribute("data-fade-start");

    await chipRow(page).evaluate((row) => row.scrollTo({ left: row.scrollWidth }));
    await expect(chipRow(page)).toHaveAttribute("data-fade-start", "");
    await expect(chipRow(page)).not.toHaveAttribute("data-fade-end");
  });

  test("keeps the panel open at the top of the page", async ({ page }) => {
    await openHydrated(page);

    await expect(panel(page)).not.toHaveAttribute("data-collapsed");
    expect((await panel(page).boundingBox())!.y).toBeGreaterThan(HEADER);
  });

  test("hides the search under the header while scrolling down, and leaves the chips", async ({ page }) => {
    await openHydrated(page);

    await scrollBy(page, 700);

    await expect(panel(page)).toHaveAttribute("data-collapsed", "");
    await expect.poll(async () => bottom(await field(page).boundingBox())).toBeLessThanOrEqual(HEADER);
    await expect.poll(async () => Math.round((await chipRow(page).boundingBox())!.y)).toBeGreaterThanOrEqual(HEADER);
    await expect.poll(async () => Math.round((await chipRow(page).boundingBox())!.y)).toBeLessThan(HEADER + 20);
  });

  test("brings the search back while scrolling up", async ({ page }) => {
    await openHydrated(page);
    await scrollBy(page, 700);
    await expect(panel(page)).toHaveAttribute("data-collapsed", "");

    await scrollBy(page, -40);

    await expect(panel(page)).not.toHaveAttribute("data-collapsed");
    await expect.poll(async () => Math.round((await field(page).boundingBox())!.y)).toBeGreaterThanOrEqual(HEADER);
  });

  test("ignores a small jitter", async ({ page }) => {
    await openHydrated(page);
    await scrollBy(page, 700);
    await scrollBy(page, -40);
    await expect(panel(page)).not.toHaveAttribute("data-collapsed");

    await scrollBy(page, 5);

    await expect(panel(page)).not.toHaveAttribute("data-collapsed");
  });

  test("keeps the search while it has the focus", async ({ page }) => {
    await openHydrated(page);
    await scrollBy(page, 700);
    await scrollBy(page, -40);
    await field(page).focus();

    await scrollBy(page, 300);

    await expect(panel(page)).not.toHaveAttribute("data-collapsed");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("moves the panel without a transition", async ({ page }) => {
      await page.goto("/en/skills");

      await expect(panel(page)).toHaveCSS("transition-property", "none");
    });
  });

  test("animates the panel's top otherwise", async ({ page }) => {
    await page.goto("/en/skills");

    await expect(panel(page)).toHaveCSS("transition-property", "top");
  });
});

test.describe("desktop layout", () => {
  test.skip(({ isMobile }) => isMobile, "the columns start at lg");

  test("keeps the design's 15 px search text on desktop", async ({ page }) => {
    await page.goto("/en/skills");

    await expect(field(page)).toHaveCSS("font-size", "15px");
  });

  test("keeps the chip counts readable in the light theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/en/skills");

    expect(await countContrast(chips(page).first())).toBeGreaterThanOrEqual(4.5);
    const idle = chips(page).nth(1);
    expect(await countContrast(idle)).toBeGreaterThanOrEqual(4.5);
    await idle.hover();
    await expect.poll(() => countContrast(idle)).toBeGreaterThanOrEqual(4.5);
  });

  test("still wraps the chips in the aside", async ({ page }) => {
    await page.goto("/en/skills");

    const tops = await chips(page).evaluateAll((all) => all.map((c) => Math.round(c.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBeGreaterThan(1);
  });

  test("shows the list in two columns", async ({ page }) => {
    await page.goto("/en/skills");

    const lefts = await rows(page).evaluateAll((meters) => meters.map((m) => m.getBoundingClientRect().left));
    expect(new Set(lefts).size).toBe(2);
  });

  test("keeps the search and the chips under the header while the list scrolls", async ({ page }) => {
    await page.goto("/en/skills");
    const search = page.getByRole("search");

    await page.mouse.wheel(0, 600);
    await expect.poll(async () => (await search.boundingBox())!.y).toBeLessThan(200);
    await page.mouse.wheel(0, 300);

    await expect.poll(async () => Math.round((await search.boundingBox())!.y)).toBe(93);
  });
});
