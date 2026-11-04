import { expect, test } from "./fixtures";

test("shows the name as the page heading, the headline and the hero skills", async ({ page }) => {
  await page.goto("/en");

  const hero = page.getByRole("region", { name: "Mikhail Aleksandrov" });
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Mikhail Aleksandrov");
  await expect(hero.getByText("Senior Frontend Software Engineer, 8+ years")).toBeVisible();
  await expect(hero.getByRole("listitem")).toHaveText(["React", "Redux", "Next.js", "Nest.js", "TypeScript", "Express"]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the four-column grid starts at lg");

  test("sits in columns 2 to 4 of the grid", async ({ page }) => {
    await page.goto("/en");

    const box = await page.getByRole("region", { name: "Mikhail Aleksandrov" }).boundingBox();
    expect(box?.x).toBeCloseTo(20 + 288 + 16, 0);
    expect(box?.width).toBeCloseTo(288 * 3 + 16 * 2, 0);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("spans the full content width", async ({ page }) => {
    await page.goto("/en");

    const box = await page.getByRole("region", { name: "Mikhail Aleksandrov" }).boundingBox();
    expect(box?.x).toBe(16);
    expect(box?.width).toBe(390 - 16 * 2);
  });
});
