import { expect, test } from "./fixtures";

test("loads the photo through the image optimizer as AVIF", async ({ page }) => {
  const optimized = page.waitForResponse((response) => response.url().includes("/_next/image"));
  await page.goto("/en");

  expect((await optimized).headers()["content-type"]).toBe("image/avif");

  const photo = page.getByRole("img", { name: "Mikhail Aleksandrov" });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test("preloads the photo, since it is the LCP element", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator('head link[rel="preload"][as="image"]')).toHaveCount(1);
  await expect(page.locator("main img").first()).toHaveAttribute("fetchpriority", "high");
});

test("downloads the photo once, even with the error replay of next/image", async ({ page }) => {
  const downloads: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/_next/image")) downloads.push(response.url());
  });

  await page.goto("/en", { waitUntil: "networkidle" });

  const sourceOf = (url: string) => new URL(url).searchParams.get("url");
  const photo = page.getByRole("img", { name: "Mikhail Aleksandrov" });
  const photoUrl = await photo.evaluate((image: HTMLImageElement) => image.currentSrc);

  expect(downloads.filter((url) => sourceOf(url) === sourceOf(photoUrl))).toHaveLength(1);
});

test.describe("when the image fails to load", () => {
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("shows the labelled placeholder in the same tile", async ({ page }) => {
    await page.route("**/_next/image**", (route) => route.fulfill({ status: 404 }));
    await page.goto("/en");

    const placeholder = page.getByRole("img", { name: "Mikhail Aleksandrov" });
    await expect.poll(() => placeholder.evaluate((element) => element.tagName)).toBe("DIV");
    await expect(placeholder).toBeVisible();
  });
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the four-column grid starts at lg");

  test("fills column 1 and is at least 380px tall", async ({ page }) => {
    await page.goto("/en");

    const box = await page.getByRole("img", { name: "Mikhail Aleksandrov" }).locator("..").boundingBox();
    expect(box?.x).toBeCloseTo(20, 0);
    expect(box?.width).toBeCloseTo(288, 0);
    expect(box?.height).toBeGreaterThanOrEqual(380);
  });

  test("loads a file at least as wide as the tile on a wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/en");

    const image = page.getByRole("img", { name: "Mikhail Aleksandrov" });
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const fileWidth = await image.evaluate((element: HTMLImageElement) => element.naturalWidth);

    expect(fileWidth).toBeGreaterThanOrEqual((await image.boundingBox())?.width ?? Infinity);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("is a square across the full content width, right after the hero", async ({ page }) => {
    await page.goto("/en");

    const hero = await page.getByRole("region", { name: "Mikhail Aleksandrov" }).boundingBox();
    const box = await page.getByRole("img", { name: "Mikhail Aleksandrov" }).locator("..").boundingBox();
    expect(box?.x).toBe(16);
    expect(box?.width).toBe(390 - 16 * 2);
    expect(box?.height).toBe(box?.width);
    expect(box?.y).toBeGreaterThan((hero?.y ?? 0) + (hero?.height ?? 0));
  });
});
