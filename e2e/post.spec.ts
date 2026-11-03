import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// The post page: static per post and locale. The data is the demo set of 2026-11-04 (eleven published posts with one
// body, no covers). A route left behind stays in the DOM, hidden, so every locator keeps to what is visible.
const main = (page: Page) => page.getByRole("main").filter({ visible: true });
const article = (page: Page) => main(page).getByRole("article");

const POST = "/en/blog/demo-post-4";
const TITLE = "Moving an e-commerce store from PHP to Next.js without losing SEO";

test.describe("cards open the post in a new tab", () => {
  test("from Home", async ({ page, context }) => {
    await page.goto("/en");

    const [post] = await Promise.all([
      context.waitForEvent("page"),
      // The Blog block's: About has a "Read more" of its own, in the same tab.
      main(page).getByRole("region", { name: "Blog" }).getByRole("link", { name: /^Read more/ }).first().click(),
    ]);

    await expect(post).toHaveURL(/\/en\/blog\/[a-z0-9-]+$/);
    await expect(page).toHaveURL(/\/en$/);
  });

  test("from the blog list, which keeps its state", async ({ page, context }) => {
    await page.goto("/en/blog?topic=software&sort=oldest");
    await expect(page.locator("html")).toHaveAttribute("data-revealed", "");

    const [post] = await Promise.all([
      context.waitForEvent("page"),
      main(page).getByRole("article").first().getByRole("heading").getByRole("link").click(),
    ]);

    await expect(post).toHaveURL(/\/en\/blog\/[a-z0-9-]+$/);
    await expect(page).toHaveURL(/\/en\/blog\?topic=software&sort=oldest$/);
  });
});

test.describe("the post", () => {
  test("shows Back, the title, the topic, the date, the tags, the lead and the body, and no cover", async ({ page }) => {
    await page.goto(POST);

    await expect(main(page).getByRole("link", { name: "Back" })).toHaveAttribute("href", "/en/blog");
    await expect(article(page).getByRole("heading", { level: 1 })).toHaveText(TITLE);
    await expect(article(page).getByRole("link", { name: "Technical" })).toHaveAttribute("href", "/en/blog?topic=technical");
    await expect(article(page).locator("time")).toHaveAttribute("datetime", /^2026-08-24/);
    await expect(article(page).getByRole("list", { name: "Tags" }).getByRole("link")).toHaveText([
      "React",
      "TypeScript",
      "Performance",
    ]);
    await expect(article(page).getByRole("link", { name: "TypeScript" })).toHaveAttribute("href", "/en/blog?tags=TypeScript");
    await expect(article(page).locator("figure")).toHaveCount(0);
    await expect(article(page).getByText(/^How we migrated page by page behind a proxy/)).toBeVisible();
    await expect(article(page).getByText("Why we didn't rewrite everything at once")).toBeVisible();
    await expect(article(page).getByRole("list").filter({ hasText: "Identical URLs" }).getByRole("listitem")).toHaveCount(3);
    await expect(article(page).getByText(/min read/)).toHaveCount(0);
  });

  test("ends with the author row: initials, name and job title", async ({ page }) => {
    await page.goto(POST);

    const author = article(page).locator("[data-author]");
    await expect(author).toContainText("MA");
    await expect(author).toContainText("Mikhail Aleksandrov");
    await expect(author).toContainText(/Engineer/);
  });

  test("falls back to the English texts in another locale, under its language", async ({ page }) => {
    await page.goto("/ru/blog/demo-post-4");

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(article(page).getByRole("heading", { level: 1 })).toHaveText(TITLE);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/ru\/blog\/demo-post-4$/);
  });

  // A real 404 status, not the App Shell's 200 (`ensureStatic`). The other-case slug is covered by
  // `src/views/post/load-post.test.ts`: on macOS the file-system route cache ignores case, so an e2e run there would
  // depend on the order of requests.
});

test.describe("an unknown slug", () => {
  // The browser logs its own console error for any 404 document.
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("is the 404 page, with its status", async ({ page }) => {
    const response = await page.goto("/en/blog/nope");

    expect(response?.status()).toBe(404);
  });
});

test.describe("metadata", () => {
  test("describes the post: title, description, article, canonical, hreflang, JSON-LD", async ({ page }) => {
    await page.goto(POST);

    await expect(page).toHaveTitle(`${TITLE} — Mikhail Aleksandrov`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /^How we migrated page by page/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe(
      "/en/blog/demo-post-4",
    );
    await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute("href", /\/de\/blog\/demo-post-4$/);

    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(jsonLd).toMatchObject({
      "@type": "BlogPosting",
      headline: TITLE,
      author: { "@type": "Person", name: "Mikhail Aleksandrov" },
      keywords: ["React", "TypeScript", "Performance"],
      inLanguage: "en",
    });
    expect(jsonLd.datePublished).toMatch(/^2026-08-24/);
  });
});

test.describe("layout", () => {
  test("never scrolls sideways at 360 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(POST);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("keeps the text column within 760 px on desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "the column is the screen on phones");
    await page.goto(POST);

    expect((await article(page).boundingBox())!.width).toBeLessThanOrEqual(760);
  });
});
