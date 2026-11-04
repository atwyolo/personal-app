import { expect, test } from "./fixtures";

// Header frame: name linking home, desktop navigation with the current page marked, sticky on scroll.
test("the name links to the home page of the current locale", async ({ page }) => {
  await page.goto("/ru");

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Mikhail Aleksandrov" })).toHaveAttribute("href", "/ru");
});

test("stays at the top of the viewport while scrolling", async ({ page }) => {
  await page.goto("/en");
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const box = await page.getByRole("banner").boundingBox();
  expect(box?.y).toBe(0);
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the navigation is shown from lg");

  test("has no menu button", async ({ page }) => {
    await page.goto("/en");

    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  });

  test("shows every section in the current locale and marks the current page", async ({ page }) => {
    await page.goto("/de");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const links = nav.getByRole("link");
    await expect(links).toHaveText(["Home", "About", "Projects", "Skills"]);
    const hrefs = await links.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(["/de", "/de/about", "/de/projects", "/de/skills"]);
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout only");

  test("hides the desktop navigation", async ({ page }) => {
    await page.goto("/en");

    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  });

  test("the menu panel lists every section, traps focus and closes with Escape", async ({ page }) => {
    await page.goto("/ru");

    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    const panel = page.getByRole("dialog", { name: "Main navigation" });
    await expect(panel.getByRole("link")).toHaveText(["Home", "About", "Projects", "Skills"]);
    await expect(panel.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/ru");
    await expect(panel.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    // Tab through more stops than the panel has: focus never leaves it.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      await expect(panel.locator(":focus")).toHaveCount(1);
    }

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout only");

  test("following a link closes the panel", async ({ page }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Main navigation" }).getByRole("link", { name: "Skills" }).click();

    await expect(page).toHaveURL(/\/en\/skills$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
