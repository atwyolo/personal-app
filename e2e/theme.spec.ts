import { expect, test } from "./fixtures";

const darkBackground = "rgb(16, 20, 42)";
const lightBackground = "rgb(243, 245, 249)";

test.describe("OS dark scheme", () => {
  test.use({ colorScheme: "dark" });

  test("uses the dark palette", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator("body")).toHaveCSS("background-color", darkBackground);
  });
});

test.describe("OS light scheme", () => {
  test.use({ colorScheme: "light" });

  test("uses the light palette", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect(page.locator("body")).toHaveCSS("background-color", lightBackground);
  });

  test("a stored choice wins over the OS scheme", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/en");

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator("body")).toHaveCSS("background-color", darkBackground);
  });
});

test.describe("before hydration", () => {
  test.use({ colorScheme: "dark", allowedConsoleErrors: [/Failed to load resource/] });

  test("the inline script applies the theme without the React bundle (no flash)", async ({ page }) => {
    await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
    await page.goto("/en");

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });
});

test.describe("theme menu", () => {
  test.use({ colorScheme: "light" });

  test("switches the theme and keeps the choice after a reload", async ({ page }) => {
    await page.goto("/en");

    await page.getByRole("banner").getByRole("button", { name: "Theme" }).click();
    const menu = page.getByRole("menu", { name: "Theme" });
    await expect(menu.getByRole("menuitemradio", { name: /System/ })).toHaveAttribute("aria-checked", "true");
    await expect(menu.getByRole("menuitemradio", { name: /System/ })).toContainText("now light");

    await menu.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator("body")).toHaveCSS("background-color", darkBackground);
  });
});


const themeColors = (page: import("@playwright/test").Page) =>
  page.locator('meta[name="theme-color"]').evaluateAll((tags) =>
    tags.map((tag) => ({ media: tag.getAttribute("media"), content: tag.getAttribute("content") })),
  );

test.describe("theme-color", () => {
  test.use({ colorScheme: "dark" });

  test("names the header colour of each scheme in the HTML", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/en`);

    expect(await themeColors(page)).toEqual([
      { media: "(prefers-color-scheme: light)", content: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", content: "#181e3b" },
    ]);
    await context.close();
  });

  test("follows a stored choice against the OS scheme", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/en");

    await expect.poll(() => themeColors(page)).toEqual([
      { media: "(prefers-color-scheme: light)", content: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", content: "#ffffff" },
    ]);
  });

  test("follows the theme menu and keeps the colour after a client navigation", async ({ page, isMobile }) => {
    await page.goto("/en");

    await page.getByRole("banner").getByRole("button", { name: "Theme" }).click();
    await page.getByRole("menu", { name: "Theme" }).getByRole("menuitemradio", { name: "Light" }).click();
    await expect.poll(async () => (await themeColors(page)).map((tag) => tag.content)).toEqual(["#ffffff", "#ffffff"]);

    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "About", exact: true }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect.poll(async () => (await themeColors(page)).map((tag) => tag.content)).toEqual(["#ffffff", "#ffffff"]);
  });

  test("the 404 page carries the tags too", async ({ request }) => {
    const html = await (await request.get("/en/does-not-exist")).text();

    expect(html).toContain('name="theme-color"');
  });
});
