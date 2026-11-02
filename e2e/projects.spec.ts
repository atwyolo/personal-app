import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const ROLE = "Senior Frontend Software Engineer";

const article = (page: Page, slug: string) => page.locator(`main article#${slug}`);
const rows = (page: Page) => page.getByRole("navigation", { name: "Places of work" }).getByRole("link");
const h1 = (page: Page) => page.getByRole("heading", { level: 1, name: "Projects · 2021 — 2026" });
const bar = (page: Page) => page.locator("[data-projects-bar]");
const heading = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });
const activeBlock = (page: Page) => page.locator("[data-projects-stage] [data-active]");

/** A click before hydration is the browser's own jump to the anchor: right for a visitor, but not what these tests read. */
const openHydrated = async (page: Page) => {
  await page.goto("/en/projects");
  await expect(rows(page).first()).toHaveAttribute("style", /--progress/);
};

const scrollToJob = (page: Page, slug: string) =>
  page.evaluate((id) => document.getElementById(id)?.scrollIntoView(), slug);

const scrollToEnd = (page: Page) => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

const getProgress = (page: Page) =>
  page
    .locator(page.viewportSize()!.width >= 1024 ? "nav a[data-job]" : "[data-segment]")
    .evaluateAll((items) => items.map((item) => Number((item as HTMLElement).style.getPropertyValue("--progress"))));

/** What the handoff's formula gives for the page as it stands now, to compare with what the component wrote. */
const getExpectedProgress = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main article")].map((item) => {
      const { top, height } = item.getBoundingClientRect();

      return Math.min(Math.max((0.4 * window.innerHeight - top) / height, 0), 1);
    }),
  );

const expectProgressToMatchPage = async (page: Page) => {
  await expect
    .poll(async () => {
      const [written, expected] = await Promise.all([getProgress(page), getExpectedProgress(page)]);

      return written.every((value, index) => Math.abs(value - expected[index]) < 0.01);
    })
    .toBe(true);
};

test.describe("content", () => {
  test("shows one article per job in order", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Glovo", "Sony PlayStation", "EPAM"]);
    const ids = await page.locator("main article").evaluateAll((items) => items.map((item) => item.id));
    expect(ids).toEqual(["glovo", "sony", "epam"]);
  });

  test("shows the role, the period and the duration under the name", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(article(page, "glovo")).toContainText(`${ROLE} · 11/2024 – 10/2026 · 2 years`);
    await expect(article(page, "sony")).toContainText(`${ROLE} · 08/2023 – 11/2024 · 1.3 years`);
    await expect(article(page, "epam")).toContainText(`${ROLE} · 07/2021 – 08/2023 · 2.2 years`);
  });

  test("shows the short description, then the full one with no heading", async ({ page }) => {
    await page.goto("/en/projects");

    const glovo = article(page, "glovo");
    await expect(glovo.getByText(/^Built an AI-powered chat for user support and set up frontend monitoring\./)).toBeVisible();
    const items = glovo.locator("li", { hasNot: page.locator("[class*=rounded-full]") });
    await expect(items).toHaveCount(4);
    await expect(items.first()).toHaveText("Built an AI-powered chat for user support.");
    await expect(glovo).not.toContainText("What I did");
  });

  test("starts every article with its heading, with no years above it", async ({ page }) => {
    await page.goto("/en/projects");

    const firstTags = await page.locator("main article").evaluateAll((items) => items.map((item) => item.firstElementChild?.tagName));
    expect(firstTags).toEqual(["H2", "H2", "H2"]);
  });

  test("shows the skills under their own heading", async ({ page }) => {
    await page.goto("/en/projects");

    const glovo = article(page, "glovo");
    await expect(glovo.getByRole("heading", { level: 3, name: "Skills" })).toBeVisible();
    await expect(glovo.locator("[data-skills] li")).toHaveText(["Next.js", "TypeScript", "Mantine", "React Hook Form", "Jest"]);
  });

  test("has one page heading", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(h1(page)).toHaveCount(1);
  });

  test("describes the page for search and social cards", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(page).toHaveTitle("Projects — Mikhail Aleksandrov");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/projects$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "The full story of every place I have worked as a frontend engineer: the products, the results and the skills behind them.",
    );
  });

  test("links the page in every language", async ({ page }) => {
    await page.goto("/en/projects");

    const links = page.locator('link[rel="alternate"][hreflang]');
    await expect(links).toHaveCount(9);
    await expect(page.locator('link[hreflang="ru"]')).toHaveAttribute("href", /\/ru\/projects$/);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute("href", /\/projects$/);
  });

  test("leads home with the Back link", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(page.getByRole("link", { name: "Back", exact: true })).toHaveAttribute("href", "/en");
  });

  test("goes to the top of Home from anywhere on the page", async ({ page }) => {
    await page.goto("/en/projects#epam");
    await expect(heading(page, "EPAM")).toBeInViewport();

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await page.waitForURL(/\/en$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  // Review focus 4.
  test("falls back to the English jobs in a locale without translations", async ({ page }) => {
    await page.goto("/ru/projects");

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Glovo", "Sony PlayStation", "EPAM"]);
  });

  // Review focus 4.
  test("stays on the page through the language menu", async ({ page }) => {
    await page.goto("/en/projects");

    await page.locator("header button").first().click();
    await page.getByRole("menuitemradio", { name: /Русский/ }).click();

    await page.waitForURL("**/ru/projects");
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("reads as an article", async ({ page }) => {
      await page.goto("/en/projects");

      for (const slug of ["glovo", "sony", "epam"]) await expect(article(page, slug)).toBeVisible();
      await expect(article(page, "epam").getByText("Raised conversion by 12.4% and made pages load 37% faster.")).toBeVisible();
      await expect(page.locator("main article li", { hasNotText: /^(Next\.js|React|TypeScript|Mantine|React Hook Form|Jest|Redux|Redux Toolkit|WebSocket|GraphQL)$/ })).toHaveCount(10);
    });
  });
});

test.describe("desktop layout", () => {
  test.skip(({ isMobile }) => isMobile, "the split starts at lg");

  test("shows the page heading above a stage with the first job", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(h1(page)).toBeVisible();
    const stage = page.locator("[data-projects-stage]");
    await expect(stage).toHaveAttribute("aria-hidden", "true");
    await expect(stage.locator("[data-active]")).not.toContainText("2024");
    await expect(stage.locator("[data-active]")).toContainText("Glovo");
    await expect(stage.locator("[data-active]")).toContainText(`${ROLE} · 2 years`);
  });

  test("links a row to every job", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(rows(page)).toHaveText([
      "01Glovo11/2024 – 10/2026",
      "02Sony PlayStation08/2023 – 11/2024",
      "03EPAM07/2021 – 08/2023",
    ]);
    const hrefs = await rows(page).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toEqual(["#glovo", "#sony", "#epam"]);
    await expect(rows(page).first()).toHaveAttribute("aria-current", "true");
  });

  test("splits the page under the header", async ({ page }) => {
    await page.goto("/en/projects");

    const left = await page.locator("[data-projects-column]").boundingBox();
    const right = await article(page, "glovo").boundingBox();
    expect(left).toMatchObject({ x: 0, y: 73 });
    expect(left!.height).toBe(800 - 73);
    expect(left!.width).toBeCloseTo(1280 * 0.45, 0);
    expect(right!.x).toBeCloseTo(1280 * 0.45, 0);
  });

  test("keeps the Back link 30 px above the page heading", async ({ page }) => {
    await page.goto("/en/projects");

    const back = await page.getByRole("link", { name: "Back", exact: true }).boundingBox();
    const heading = await h1(page).boundingBox();
    expect(heading!.y - (back!.y + back!.height)).toBe(30);
  });

  test("gives every job a screen", async ({ page }) => {
    await page.goto("/en/projects");

    const box = await article(page, "sony").boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(800 * 0.95);
  });

  test("moves the image from the articles to the stage", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(article(page, "glovo").getByRole("img")).toHaveCount(0);
    await expect(activeBlock(page).locator("img")).toBeVisible();
    await expect(activeBlock(page).locator("img")).toHaveAttribute("alt", "Glovo");
  });

  test("shows a placeholder on the stage for a job with no image", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToJob(page, "sony");

    await expect(activeBlock(page)).toContainText("Sony PlayStation");
    await expect(activeBlock(page).locator('[role="img"]')).toBeVisible();
    await expect(activeBlock(page).locator("img")).toHaveCount(0);
  });

  test("puts the image above the name, at its height", async ({ page }) => {
    await page.goto("/en/projects");

    const image = await activeBlock(page).locator("img").boundingBox();
    const name = await activeBlock(page).getByText("Glovo", { exact: true }).boundingBox();
    expect(image!.height).toBe(200);
    expect(image!.y + image!.height).toBeLessThan(name!.y);
  });

  test("centers the image, the name and the role in the stage", async ({ page }) => {
    await page.goto("/en/projects");

    const stage = await page.locator("[data-projects-stage]").boundingBox();
    const image = await activeBlock(page).locator("img").boundingBox();
    const role = await activeBlock(page).getByText(`${ROLE} · 2 years`).boundingBox();
    const above = image!.y - stage!.y;
    const below = stage!.y + stage!.height - (role!.y + role!.height);

    expect(above).toBeGreaterThan(0);
    expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
  });

  test.describe("at the lowest height that keeps the image", () => {
    test.use({ viewport: { width: 1280, height: 640 } });

    test("shows it at a useful height", async ({ page }) => {
      await page.goto("/en/projects");

      expect((await activeBlock(page).locator("img").boundingBox())!.height).toBeGreaterThanOrEqual(100);
    });
  });

  // Review focus 3.
  test.describe("in a short window", () => {
    test.use({ viewport: { width: 1024, height: 600 } });

    test("keeps the rows inside the window", async ({ page }) => {
      await page.goto("/en/projects");

      const last = await rows(page).last().boundingBox();
      expect(last!.y + last!.height).toBeLessThanOrEqual(600);
    });
  });

  // Review focus 3. The stage shrinks and clips: nothing of it may cover a row, seen or unseen.
  test.describe("in a very short window", () => {
    test.use({ viewport: { width: 1280, height: 520 } });

    test("gives up the image before the name, with no sliver left", async ({ page }) => {
      await page.goto("/en/projects");

      await expect(activeBlock(page).locator("img")).toBeHidden();
      const stage = await page.locator("[data-projects-stage]").boundingBox();
      const name = await activeBlock(page).getByText("Glovo", { exact: true }).boundingBox();
      const role = await activeBlock(page).getByText(`${ROLE} · 2 years`).boundingBox();

      expect(name!.y).toBeGreaterThanOrEqual(stage!.y);
      expect(role!.y + role!.height).toBeLessThanOrEqual(stage!.y + stage!.height);
    });

    test("leaves every row clickable from edge to edge", async ({ page }) => {
      await page.goto("/en/projects");

      const missed = await rows(page).evaluateAll((links) =>
        links.flatMap((link, index) => {
          const { left, top, bottom } = link.getBoundingClientRect();
          const hits = [top + 1, (top + bottom) / 2, bottom - 1].map((y) =>
            document.elementFromPoint(left + 40, y)?.closest("a"),
          );

          return hits.every((hit) => hit === link) ? [] : [index];
        }),
      );

      expect(missed).toEqual([]);
    });
  });

  // Review focus 5.
  test.describe("at the first width of the split", () => {
    test.use({ viewport: { width: 1024, height: 800 } });

    test("does not widen the page", async ({ page }) => {
      await page.goto("/en/projects");

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1024);
    });

    // The company name wraps inside the column's padding.
    test("keeps a long company name inside the column", async ({ page }) => {
      await page.goto("/en/projects");

      const [nameRight, contentRight] = await page.locator("[data-projects-column]").evaluate((column) => {
        const name = column.querySelector('[data-projects-stage] [data-job="1"] > :nth-child(2)') as Element;
        const range = document.createRange();
        range.selectNodeContents(name);
        const { right, width } = column.getBoundingClientRect();

        return [range.getBoundingClientRect().right, right - (width - column.clientWidth) - 40];
      });

      expect(nameRight).toBeLessThanOrEqual(contentRight);
    });
  });
});

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("keeps the page heading for a screen reader only", async ({ page }) => {
    await page.goto("/en/projects");

    const box = await h1(page).boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1);
  });

  test("hides the stage and the rows", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(page.locator("[data-projects-stage]")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Places of work" })).toBeHidden();
  });

  test("shows the first job in the bar, hidden from a screen reader", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(bar(page)).toHaveAttribute("aria-hidden", "true");
    await expect(bar(page).locator("[data-active]").first()).toContainText("Glovo");
    await expect(bar(page).locator("[data-active]").first()).toContainText("11/2024 – 10/2026");
    await expect(bar(page).locator("[data-segment]")).toHaveCount(3);
  });

  test("pins the bar under the header", async ({ page }) => {
    await page.goto("/en/projects");
    await page.evaluate(() => window.scrollTo(0, 600));

    await expect.poll(async () => (await bar(page).boundingBox())?.y).toBe(64);
  });

  test("shows the image between the role and the description, at its height", async ({ page }) => {
    await page.goto("/en/projects");

    const tags = await article(page, "glovo").evaluate((item) => [...item.children].slice(0, 4).map((child) => child.tagName));
    expect(tags).toEqual(["H2", "P", "DIV", "P"]);
    await expect(article(page, "glovo").getByRole("img", { name: "Glovo" })).toHaveJSProperty("tagName", "IMG");

    const box = await article(page, "glovo").getByRole("img", { name: "Glovo" }).boundingBox();
    expect(box!.height).toBe(130);
  });

  test("shows a placeholder for a job with no image", async ({ page }) => {
    await page.goto("/en/projects");

    await expect(article(page, "sony").getByRole("img", { name: "Sony PlayStation" })).toHaveJSProperty("tagName", "DIV");
  });

  // Review focus 3.
  test.describe("turned to landscape", () => {
    test.use({ viewport: { width: 844, height: 390 } });

    test("leaves the first heading below the bar", async ({ page }) => {
      await page.goto("/en/projects");

      const barBox = await bar(page).boundingBox();
      const heading = await page.getByRole("heading", { level: 2, name: "Glovo" }).boundingBox();
      expect(heading!.y).toBeGreaterThanOrEqual(barBox!.y + barBox!.height);
    });
  });

  // Review focus 5.
  test.describe("at 320 px", () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test("wraps the bar instead of widening the page", async ({ page }) => {
      await page.goto("/en/projects");

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    });
  });

  // The name and the period no longer fit one line, so the bar is at its tallest here.
  test.describe("at 280 px", () => {
    test.use({ viewport: { width: 280, height: 640 } });

    test("clears the bar on two lines too", async ({ page }) => {
      await page.goto("/en/projects#sony");

      const name = heading(page, "Sony PlayStation");
      await expect(name).toBeInViewport();
      await expect(bar(page).locator("[data-active]").first()).toContainText("Sony PlayStation");
      const barBox = await bar(page).boundingBox();
      expect(barBox!.height).toBeGreaterThan(60);
      expect((await name.boundingBox())!.y).toBeGreaterThanOrEqual(barBox!.y + barBox!.height);
    });
  });
});

test.describe("reading progress on desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the rows are shown from lg");

  test("moves the active row as the page scrolls", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToJob(page, "sony");
    await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
    await expect(rows(page).first()).not.toHaveAttribute("aria-current");

    await scrollToJob(page, "epam");
    await expect(rows(page).nth(2)).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[data-projects-stage] [data-active]")).toContainText("EPAM");
  });

  test("grows the bars with the reading", async ({ page }) => {
    await page.goto("/en/projects");
    await page.evaluate(() => window.scrollTo(0, 500));

    await expectProgressToMatchPage(page);
    expect((await getProgress(page))[0]).toBeGreaterThan(0);
  });

  test("finishes everything at the end of the page", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToEnd(page);

    await expect(rows(page).nth(2)).toHaveAttribute("aria-current", "true");
    await expect.poll(() => getProgress(page)).toEqual([1, 1, 1]);
  });

  test("keeps the column pinned", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToEnd(page);

    await expect.poll(async () => (await page.locator("[data-projects-column]").boundingBox())?.y).toBe(73);
  });

  test("lands a clicked job below the header, with the focus on it", async ({ page }) => {
    await openHydrated(page);

    await rows(page).nth(1).click();

    await expect(page).toHaveURL(/#sony$/);
    await expect.poll(async () => (await article(page, "sony").boundingBox())?.y).toBe(73);
    await expect(article(page, "sony")).toBeFocused();
  });

  test("adds no history entry for a row", async ({ page }) => {
    await openHydrated(page);
    const before = await page.evaluate(() => history.length);

    await rows(page).nth(1).click();
    await rows(page).nth(2).click();

    await expect(page).toHaveURL(/#epam$/);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("holds the clicked row while the page travels to it", async ({ page }) => {
    await openHydrated(page);

    const seen = await page.evaluate(async () => {
      const links = [...document.querySelectorAll('nav[aria-label="Places of work"] a')] as HTMLElement[];
      const active = new Set<number>();
      let last = -1;
      let still = 0;

      links[2].click();
      while (still < 20) {
        await new Promise(requestAnimationFrame);
        active.add(links.findIndex((link) => link.hasAttribute("aria-current")));
        still = window.scrollY === last ? still + 1 : 0;
        last = window.scrollY;
      }

      return [...active];
    });

    expect(seen).toEqual([2]);
  });

  test("follows the page again after a hand scroll", async ({ page }) => {
    await openHydrated(page);
    await rows(page).nth(2).click();
    await expect(article(page, "epam")).toBeInViewport();
    await expect.poll(async () => (await article(page, "epam").boundingBox())?.y).toBe(73);

    await page.mouse.move(800, 400);
    await page.mouse.wheel(0, -900);

    await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
  });

  // Review focus 2. The route stays in the DOM, so the hold of the last visit must not come back with it.
  test("starts over after leaving for another page and coming back through the menu", async ({ page }) => {
    await openHydrated(page);
    await rows(page).nth(2).click();
    await expect.poll(async () => (await article(page, "epam").boundingBox())?.y).toBe(73);

    await page.getByRole("banner").getByRole("link", { name: "About" }).click();
    await page.waitForURL("**/en/about");
    await page.getByRole("banner").getByRole("link", { name: "Projects" }).click();
    await page.waitForURL("**/en/projects");

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(rows(page).first()).toHaveAttribute("aria-current", "true");
    await expectProgressToMatchPage(page);
  });

  // Review focus 2. Wherever the browser puts the page on the way back, the column must agree with it.
  test("agrees with the page after the browser's Back", async ({ page }) => {
    await openHydrated(page);
    await rows(page).nth(1).click();
    await expect.poll(async () => (await article(page, "sony").boundingBox())?.y).toBe(73);
    await page.mouse.move(800, 400);
    await page.mouse.wheel(0, 800);
    await expect(rows(page).nth(2)).toHaveAttribute("aria-current", "true");

    await page.getByRole("banner").getByRole("link", { name: "About" }).click();
    await page.waitForURL("**/en/about");
    await page.goBack();
    await page.waitForURL("**/en/projects#sony");

    await expectProgressToMatchPage(page);
    const expected = await page.evaluate(
      () =>
        [...document.querySelectorAll("main article")].findLastIndex(
          (item) => item.getBoundingClientRect().top < 0.4 * window.innerHeight,
        ),
    );
    await expect(rows(page).nth(expected)).toHaveAttribute("aria-current", "true");
  });

  // Review focus 3.
  test.describe("in a tall window", () => {
    test.use({ viewport: { width: 1280, height: 1400 } });

    test("finishes everything at the end of the page", async ({ page }) => {
      await page.goto("/en/projects");

      await scrollToEnd(page);

      await expect(rows(page).nth(2)).toHaveAttribute("aria-current", "true");
      await expect.poll(() => getProgress(page)).toEqual([1, 1, 1]);
    });
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("jumps to a clicked job", async ({ page }) => {
      await openHydrated(page);

      await rows(page).nth(2).click();

      await expect(article(page, "epam")).toBeFocused();
      expect((await article(page, "epam").boundingBox())?.y).toBe(73);
    });

    test("swaps the stage without a transition", async ({ page }) => {
      await page.goto("/en/projects");

      await expect(page.locator("[data-projects-stage] [data-job]").first()).toHaveCSS("transition-property", "none");
    });

    test("still updates the bars", async ({ page }) => {
      await page.goto("/en/projects");
      await page.evaluate(() => window.scrollTo(0, 500));

      await expectProgressToMatchPage(page);
    });
  });
});

test.describe("reading progress on phones", () => {
  test.skip(({ isMobile }) => !isMobile, "the bar is shown below lg");

  test("shows the job being read in the bar", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToJob(page, "sony");

    await expect(bar(page).locator("[data-active]").first()).toContainText("Sony PlayStation");
    await expect(bar(page).locator("[data-active]").first()).toContainText("08/2023 – 11/2024");
    await expectProgressToMatchPage(page);
  });

  test("finishes everything at the end of the page", async ({ page }) => {
    await page.goto("/en/projects");

    await scrollToEnd(page);

    await expect(bar(page).locator("[data-active]").first()).toContainText("EPAM");
    await expect.poll(() => getProgress(page)).toEqual([1, 1, 1]);
  });

  // Review focus 3.
  test("recomputes the bars when the phone turns", async ({ page }) => {
    await page.goto("/en/projects");
    await scrollToJob(page, "sony");
    await expectProgressToMatchPage(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await expectProgressToMatchPage(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectProgressToMatchPage(page);
  });
});

test.describe("deep links", () => {
  // Review focus 1.
  test("lands a fresh link to a job below the sticky bars, with that job active", async ({ page, isMobile }) => {
    await page.goto("/en/projects#epam");

    const name = heading(page, "EPAM");
    await expect(name).toBeInViewport();
    const stickyBottom = isMobile ? ((await bar(page).boundingBox())!.y + (await bar(page).boundingBox())!.height) : 73;
    await expect.poll(async () => (await name.boundingBox())!.y).toBeGreaterThanOrEqual(stickyBottom);

    if (isMobile) await expect(bar(page).locator("[data-active]").first()).toContainText("EPAM");
    else await expect(rows(page).nth(2)).toHaveAttribute("aria-current", "true");
  });

  test("arrives at the job from Learn more on Home", async ({ page, isMobile }) => {
    await page.goto("/en");

    const card = page.getByRole("region", { name: "Experience" }).getByRole("article").nth(1);
    await card.getByRole("link", { name: "Learn more" }).click();

    await page.waitForURL("**/en/projects#sony");
    await expect(heading(page, "Sony PlayStation")).toBeInViewport();
    const barBox = await bar(page).boundingBox();
    const stickyBottom = isMobile ? barBox!.y + barBox!.height : 73;
    await expect.poll(async () => (await heading(page, "Sony PlayStation").boundingBox())!.y).toBeGreaterThanOrEqual(stickyBottom);

    if (isMobile) await expect(bar(page).locator("[data-active]").first()).toContainText("Sony PlayStation");
    else await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
  });
});

test.describe("in print", () => {
  test("keeps the articles and drops what follows them", async ({ page, isMobile }) => {
    await page.goto("/en/projects");
    await page.emulateMedia({ media: "print" });

    await expect(page.locator("[data-projects-column]")).toBeHidden();
    await expect(bar(page)).toBeHidden();
    await expect(article(page, "epam")).toBeVisible();
    if (isMobile) return;

    await expect(article(page, "sony")).toHaveCSS("min-height", "0px");
    expect((await article(page, "sony").boundingBox())!.width).toBe(1280);
    await expect(article(page, "glovo").getByRole("img", { name: "Glovo" })).toBeVisible();
  });
});
