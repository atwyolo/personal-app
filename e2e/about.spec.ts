import { expect, test } from "./fixtures";

// The About page: an interview read from the database. Sections are located by their id, because a route left
// behind stays in the DOM, hidden, and an unscoped `h1` could match it.
const sections = (page: import("@playwright/test").Page) => page.locator("main section[id]");

const questions = [
  "Who are you, in two sentences?",
  "How do you like to work?",
  "What results are you proud of?",
  "What kind of teams have you worked in?",
  "What are you looking for next?",
  "And outside of work?",
];

test.describe("about page", () => {
  test("shows the hero", async ({ page }) => {
    await page.goto("/en/about");

    await expect(page.getByRole("heading", { level: 1, name: "About me" })).toBeVisible();
    await expect(
      page.getByText("A short interview with myself: the questions recruiters ask most, answered properly."),
    ).toBeVisible();
  });

  test("renders the pairs in reading order", async ({ page }) => {
    await page.goto("/en/about");

    await expect(sections(page).getByRole("heading", { level: 2 })).toHaveText(questions);
    const ids = await sections(page).evaluateAll((items) => items.map((item) => item.id));
    expect(ids).toEqual(["who", "how", "results", "scale", "next", "life"]);
  });

  test("shows the label and a decorative avatar in a pair", async ({ page }) => {
    await page.goto("/en/about");

    const pair = page.locator("#who");
    await expect(pair.getByText("Who I am", { exact: true })).toBeVisible();
    await expect(
      pair.getByText("I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js."),
    ).toBeVisible();

    const avatar = pair.locator('[aria-hidden="true"]', { hasText: "MA" });
    await expect(avatar).toBeVisible();
  });

  test("renders the rich text of an answer", async ({ page }) => {
    await page.goto("/en/about");

    const items = page.locator("#results").getByRole("listitem");
    await expect(items).toHaveCount(3);
    await expect(items.first()).toContainText("At EPAM, I helped migrate");
  });

  test("has its own title and canonical address", async ({ page }) => {
    await page.goto("/en/about");

    await expect(page).toHaveTitle("About — Mikhail Aleksandrov");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe("/en/about");
  });

  test("falls back to the English pairs in a locale without translations", async ({ page }) => {
    await page.goto("/ru/about");

    await expect(page.locator("html[lang=ru]")).toBeAttached();
    await expect(sections(page).getByRole("heading", { level: 2 })).toHaveText(questions);
  });

  test("stays on the page when the language changes", async ({ page }) => {
    await page.goto("/en/about");

    await page.locator("header button").first().click();
    await page.getByRole("menuitemradio", { name: /Русский/ }).click();

    await page.waitForURL("**/ru/about");
    // The English page stays in the DOM, hidden, so the two languages are told apart by visibility.
    await expect(sections(page).filter({ visible: true })).toHaveCount(questions.length);
  });

  test("does not scroll sideways on a 320 px phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/en/about");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBe(clientWidth);
  });
});
