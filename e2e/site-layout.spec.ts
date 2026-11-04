import { expect, test } from "./fixtures";

const edges = async (locator: { boundingBox: () => Promise<{ x: number; width: number } | null> }) => {
  const box = await locator.boundingBox();
  return { left: box?.x, right: (box?.x ?? 0) + (box?.width ?? 0) };
};

test.describe("desktop width", () => {
  test.skip(({ isMobile }) => isMobile, "the full-width layout starts at lg");

  test("stretches the content and the header on a wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/en");

    const experience = page.getByRole("region", { name: "Experience" });
    await expect(experience).toBeVisible();
    expect(await edges(experience)).toEqual({ left: 20, right: 1860 });

    expect((await edges(page.getByRole("link", { name: "Mikhail Aleksandrov" }))).left).toBe(20);
    const themeMenu = page.getByRole("button", { name: "Theme" });
    expect((await edges(themeMenu)).right).toBe(1860);
  });

  test("keeps the same side padding at the lg breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/en");

    expect(await edges(page.getByRole("region", { name: "Experience" }))).toEqual({ left: 20, right: 964 });
  });

  test("keeps the 720px column below lg", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 768 });
    await page.goto("/en");

    const { left, right } = await edges(page.getByRole("region", { name: "Experience" }));
    expect((right ?? 0) - (left ?? 0)).toBe(720 - 2 * 16);
  });
});
