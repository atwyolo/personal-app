import { expect, test } from "./fixtures";

test("preloads one font and leaves the first screen's bandwidth to the photo", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator('head link[rel="preload"][as="font"]')).toHaveCount(1);
});

test("sends the CSS inside the document, so a first visit has no render-blocking request", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator('head link[rel="stylesheet"]')).toHaveCount(0);

  const inlined = await page
    .locator("head style")
    .evaluateAll((styles) => styles.some((style) => style.textContent?.includes(".reveal")));

  expect(inlined).toBe(true);
});

test("keeps Cyrillic glyphs available on demand, without a preload", async ({ page }) => {
  await page.goto("/ru");

  const faces = await page.evaluate(async () => {
    const family = getComputedStyle(document.body).fontFamily;
    const loaded = await document.fonts.load(`16px ${family}`, "Ж");

    return loaded.map((font) => ({ family: font.family, range: font.unicodeRange }));
  });

  expect(faces.filter((face) => face.family.startsWith("Geist") && face.range.includes("U+400-45F"))).toHaveLength(1);
});

test("home page shows the profile from the content files", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("heading", { level: 1, name: "Mikhail Aleksandrov" })).toBeVisible();
  await expect(page.getByText("Senior Frontend Software Engineer, 8+ years")).toBeVisible();
  await expect(page.getByRole("link", { name: /\+374/ })).toHaveAttribute("href", "https://wa.me/37493310039");
});
