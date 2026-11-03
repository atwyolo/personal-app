import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// The blog list: every state lives in the URL and is rendered on the server. The data is the demo set of
// 2026-11-03 (eleven published posts, Technical 6, Software 5, Hobby none); where the owner will edit it, the tests
// read the page itself. A route left behind stays in the DOM, hidden, so every locator keeps to what is visible.
const main = (page: Page) => page.getByRole("main").filter({ visible: true });
const cards = (page: Page) => main(page).getByRole("article");
const count = (page: Page) => main(page).getByRole("status");
const topics = (page: Page) => main(page).getByRole("group", { name: "Topic" });
const pagination = (page: Page) => main(page).getByRole("navigation", { name: "Pagination" });
const pageSizes = (page: Page) => main(page).getByRole("group", { name: "Posts per page" });
const sort = (page: Page) => main(page).getByRole("group", { name: "Sort by date" });
const tagField = (page: Page) => main(page).getByRole("combobox", { name: "Search by tag" });
const scope = (page: Page) => main(page).locator("[data-navigation-scope]");

const dates = (page: Page) => cards(page).locator("time").evaluateAll((times) => times.map((t) => t.getAttribute("datetime")!));

/** The list is interactive once React has hydrated the scope that takes over the clicks. */
const openHydrated = async (page: Page, path = "/en/blog") => {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-revealed", "");
  await expect(main(page).locator("[data-navigation-scope][data-hydrated]")).toHaveCount(1);
};

const pathAndQuery = (page: Page) => {
  const url = new URL(page.url());
  return decodeURIComponent(url.pathname + url.search);
};

test.describe("the default list", () => {
  test("shows the hero, the count, ten cards newest first, page 1 of 2, and no Hobby", async ({ page }) => {
    await openHydrated(page);

    await expect(main(page).getByRole("link", { name: "Back" })).toHaveAttribute("href", "/en");
    await expect(main(page).getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await expect(count(page)).toHaveText("11 posts");
    await expect(cards(page)).toHaveCount(10);
    const shown = await dates(page);
    expect(shown).toEqual([...shown].sort().reverse());
    await expect(pagination(page).getByRole("link", { name: "Go to page 1" })).toHaveAttribute("aria-current", "page");
    await expect(topics(page).getByRole("link")).toHaveText([/^All\s*11$/, /^Technical\s*6$/, /^Software\s*5$/]);
  });

  test("is linked from Home's All posts", async ({ page }) => {
    await page.goto("/en");
    await main(page).getByRole("link", { name: "All posts" }).click();

    await expect(page).toHaveURL(/\/en\/blog$/);
  });
});

test.describe("controls", () => {
  test("a topic chip filters, adds one history entry, and Back returns", async ({ page }) => {
    await openHydrated(page);
    const before = await page.evaluate(() => history.length);

    await topics(page).getByRole("link", { name: /Software/ }).click();

    await expect(page).toHaveURL(/\/en\/blog\?topic=software$/);
    await expect(count(page)).toHaveText("5 of 11 posts");
    await expect(cards(page)).toHaveCount(5);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);

    await page.goBack();
    await expect(count(page)).toHaveText("11 posts");
  });

  test("a tag from the search filters and the counts follow", async ({ page }) => {
    await openHydrated(page);

    await tagField(page).fill("jes");
    await page.getByRole("option", { name: /Jest/ }).click();

    await expect(page).toHaveURL(/\?tags=Jest$/);
    await expect(count(page)).toHaveText("3 of 11 posts");
    await expect(topics(page).getByRole("link")).toHaveText([/^All\s*3$/, /^Technical\s*0$/, /^Software\s*3$/]);
    await expect(tagField(page)).toHaveValue("");
  });

  test("a tag on a card toggles it, its × and Reset remove it", async ({ page }) => {
    await openHydrated(page, "/en/blog?topic=software");

    await cards(page).first().getByRole("link", { name: "Team process" }).click();
    await expect(page).toHaveURL(/\?topic=software&tags=Team%20process$/);
    await expect(cards(page).first().getByRole("link", { name: "Team process" })).toHaveAttribute("aria-current", "true");

    await main(page).getByRole("link", { name: "Remove tag Team process" }).click();
    await expect(page).toHaveURL(/\?topic=software$/);

    await cards(page).first().getByRole("link", { name: "Team process" }).click();
    await expect(page).toHaveURL(/tags=Team%20process/);
    await main(page).getByRole("link", { name: "Reset", exact: true }).click();
    await expect(page).toHaveURL(/\?topic=software$/);
  });

  test("sorts by the oldest", async ({ page }) => {
    await openHydrated(page);

    await sort(page).getByRole("link", { name: "Oldest" }).click();

    await expect(page).toHaveURL(/\?sort=oldest$/);
    await expect(sort(page).getByRole("link", { name: "Oldest" })).toHaveAttribute("aria-current", "true");
    const shown = await dates(page);
    expect(shown).toEqual([...shown].sort());
  });

  test("pages, moving the focus to the list header", async ({ page }) => {
    await openHydrated(page);

    await pagination(page).getByRole("link", { name: "Go to page 2" }).click();

    await expect(page).toHaveURL(/\?page=2$/);
    await expect(cards(page)).toHaveCount(1);
    await expect(count(page)).toBeFocused();
  });

  test("removing a tag with the keyboard moves the focus to the list header, not to the top of the page", async ({
    page,
  }) => {
    await openHydrated(page, "/en/blog?tags=React");

    await main(page).getByRole("link", { name: "Remove tag React" }).focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/en\/blog$/);
    await expect(count(page)).toBeFocused();
  });

  test("switching to 20 per page on page 2 lands on page 1, with no pagination", async ({ page }) => {
    await openHydrated(page, "/en/blog?page=2");

    await pageSizes(page).getByRole("link", { name: "20" }).click();

    await expect(page).toHaveURL(/\?per=20$/);
    await expect(cards(page)).toHaveCount(11);
    await expect(pagination(page)).toHaveCount(0);
    await expect(pageSizes(page).getByRole("link", { name: "20" })).toHaveAttribute("aria-current", "true");
  });

  test("a filter change goes back to page 1", async ({ page }) => {
    await openHydrated(page, "/en/blog?page=2");

    await sort(page).getByRole("link", { name: "Oldest" }).click();

    await expect(page).toHaveURL(/\?sort=oldest$/);
  });

  test("a fast double click on a page makes one history entry", async ({ page }) => {
    await openHydrated(page);
    const before = await page.evaluate(() => history.length);

    await pagination(page).getByRole("link", { name: "Go to page 2" }).dblclick();

    await expect(page).toHaveURL(/\?page=2$/);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
  });

  test("keeps the old list, busy, until the new one lands", async ({ page }) => {
    await openHydrated(page);
    // Hold the server's answer so the pending state can be seen.
    let release: () => void = () => {};
    await page.route(/\/en\/blog\?topic=technical/, async (route) => {
      await new Promise<void>((done) => (release = done));
      await route.continue();
    });

    await topics(page).getByRole("link", { name: /Technical/ }).click();

    await expect(scope(page)).toHaveAttribute("aria-busy", "true");
    await expect(cards(page)).toHaveCount(10);
    release();
    await expect(count(page)).toHaveText("6 of 11 posts");
    await expect(scope(page)).not.toHaveAttribute("aria-busy");
  });
});

test.describe("deep links", () => {
  test("open in their state", async ({ page }) => {
    await openHydrated(page, "/en/blog?topic=software&tags=Team%20process&sort=oldest");

    await expect(count(page)).toHaveText("5 of 11 posts");
    await expect(topics(page).getByRole("link", { name: /Software/ })).toHaveAttribute("aria-current", "true");
    await expect(main(page).getByRole("link", { name: "Remove tag Team process" })).toBeVisible();
    expect(pathAndQuery(page)).toBe("/en/blog?topic=software&tags=Team process&sort=oldest");
  });

  for (const query of ["?topic=nope", "?tags=React,Nope", "?page=3", "?per=30", "?topic=hobby", "?page=02"]) {
    test(`fall back to the default and a clean address: ${query}`, async ({ page }) => {
      await page.goto("/en");
      await openHydrated(page, `/en/blog${query}`);

      await expect(page).toHaveURL(/\/en\/blog$/);
      await expect(count(page)).toHaveText("11 posts");

      await page.goBack();
      await expect(page).toHaveURL(/\/en$/);
    });
  }

  test("ignore parameters they do not know", async ({ page }) => {
    await openHydrated(page, "/en/blog?utm_source=linkedin");

    await expect(page).toHaveURL(/\?utm_source=linkedin$/);
    await expect(count(page)).toHaveText("11 posts");
  });

  test("show the empty state for a valid filter with no post, and Reset filters", async ({ page }) => {
    await openHydrated(page, "/en/blog?topic=technical&tags=Jest");

    await expect(main(page).getByText("No posts here yet")).toBeVisible();
    await expect(main(page).getByText("Try another topic or tag.")).toBeVisible();
    await main(page).getByRole("link", { name: "Reset filters" }).click();
    await expect(page).toHaveURL(/\/en\/blog$/);
    await expect(count(page)).toHaveText("11 posts");
  });
});

test.describe("before hydration", () => {
  test("every control is a link with its state in the server HTML", async ({ request }) => {
    const html = await (await request.get("/en/blog")).text();

    for (const href of ["/en/blog?topic=technical", "/en/blog?sort=oldest", "/en/blog?page=2", "/en/blog?per=20"]) {
      expect(html, href).toContain(`href="${href}"`);
    }
  });

  test("a first visit holds the skeleton in the static shell", async ({ request }) => {
    const html = await (await request.get("/en/blog")).text();

    expect(html).toContain("data-blog-skeleton");
  });
});

test.describe("phone", () => {
  test.skip(({ isMobile }) => !isMobile, "the panel folds only on phones");

  test("after a page change from the bottom, the list header shows below the panel and the header", async ({ page }) => {
    // From the short page 2 to the long page 1: only a long page can scroll its header to the top of the view.
    await openHydrated(page, "/en/blog?page=2");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    await pagination(page).getByRole("link", { name: "Go to page 1" }).click();
    await expect(page).toHaveURL(/\/en\/blog$/);
    await expect(count(page)).toBeFocused();
    // Let the smooth parts settle: the panel unfolds while the view moves up.
    await page.evaluate(() => new Promise((done) => setTimeout(done, 400)));

    const [head, panel] = await Promise.all([count(page).boundingBox(), main(page).locator("[data-filter-panel]").boundingBox()]);
    expect(head!.y).toBeGreaterThanOrEqual(panel!.y + panel!.height);
    expect(head!.y).toBeGreaterThanOrEqual(64);
  });

  test("orders search, topics, selected tags; sticks and folds; no sideways scroll", async ({ page }) => {
    await openHydrated(page, "/en/blog?tags=React");
    const panel = main(page).locator("[data-filter-panel]");

    const order = await panel.evaluate((element) => {
      const of = (selector: string) => element.querySelector(selector)!;
      const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const search = of('[role="combobox"]');
      const topicsGroup = of('[aria-label="Topic"]');
      const selected = of('[aria-label="Selected tags"]');
      return before(search, topicsGroup) && before(topicsGroup, selected);
    });
    expect(order).toBe(true);

    await page.evaluate(() => window.scrollBy(0, 600));
    await expect(panel).toHaveAttribute("data-stuck", "");
    await expect(panel).toHaveAttribute("data-collapsed", "");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
