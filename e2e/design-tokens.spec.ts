import { expect, test } from "./fixtures";

test.describe("design tokens", () => {
  test("light theme uses the design palette and Geist", async ({ page }) => {
    await page.goto("/en");

    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", "rgb(243, 245, 249)");
    await expect(body).toHaveCSS("color", "rgb(16, 20, 42)");
    await expect(body).toHaveCSS("font-family", /Geist/);
  });

  test("dark theme switches the palette with the .dark class", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/en");

    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", "rgb(16, 20, 42)");
    await expect(body).toHaveCSS("color", "rgb(237, 239, 247)");
  });
});
