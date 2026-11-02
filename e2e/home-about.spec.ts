import { expect, test } from "./fixtures";

// About tile: the profile's rich text with its structure kept, then a link to the About page.
test("shows the lead, the results list and the read more link", async ({ page }) => {
  await page.goto("/en");

  const about = page.getByRole("region", { name: "About" });
  await expect(about.getByRole("heading", { level: 2, name: "About" })).toBeVisible();
  await expect(about.getByText(/^I'm a Senior Frontend Engineer/)).toBeVisible();
  await expect(about.locator("strong")).toHaveText("A few results I'm proud of:");
  await expect(about.getByRole("listitem")).toHaveText([/^At EPAM/, /^At Glovo/, /^At Sony PlayStation/]);
  await expect(about.getByRole("link", { name: "Read more" })).toBeVisible();
});

test("keeps the current locale in the read more link", async ({ page }) => {
  await page.goto("/de");

  await expect(page.getByRole("region", { name: "About" }).getByRole("link")).toHaveAttribute("href", "/de/about");
});

test("styles read more as the design's text link, not a button", async ({ page }) => {
  await page.goto("/en");

  const link = page.getByRole("region", { name: "About" }).getByRole("link", { name: "Read more" });
  await expect(link).toHaveText("Read more →");
  await expect(link).toHaveCSS("font-size", "15px");
  await expect(link).toHaveCSS("font-weight", "600");
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  await expect(link).toHaveCSS("text-decoration-thickness", "2px");
  await expect(link).toHaveCSS("text-underline-offset", "5px");
  await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("styles the list bullets as small squares", async ({ page }) => {
  await page.goto("/en");

  const bullet = page.getByRole("region", { name: "About" }).getByRole("listitem").first();
  const size = await bullet.evaluate((item) => {
    const { width, height, borderRadius } = getComputedStyle(item, "::before");
    return { width, height, borderRadius };
  });

  expect(size).toEqual({ width: "8px", height: "8px", borderRadius: "2px" });
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the four-column grid starts at lg");

  test("uses the design's desktop type sizes", async ({ page }) => {
    await page.goto("/en");

    const about = page.getByRole("region", { name: "About" });
    await expect(about.getByText(/^I'm a Senior Frontend Engineer/)).toHaveCSS("font-size", "20px");
    await expect(about.locator("strong")).toHaveCSS("font-size", "16px");
  });

  // Viewport 1280: 20px on the left, 60px on the right, columns (1200 - 3 * 16) / 4 = 288.
  test("sits in columns 2 to 4 and ends on the contacts' bottom line", async ({ page }) => {
    await page.goto("/en");

    const box = await page.getByRole("region", { name: "About" }).boundingBox();
    const contacts = await page.getByRole("list", { name: "Contacts" }).boundingBox();

    expect(box?.x).toBeCloseTo(20 + 288 + 16, 0);
    expect(box?.width).toBeCloseTo(288 * 3 + 16 * 2, 0);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo((contacts?.y ?? 0) + (contacts?.height ?? 0), 0);
  });

  test("keeps the hero tile above it, without stretching", async ({ page }) => {
    await page.goto("/en");

    const hero = await page.getByRole("region", { name: "Mikhail Aleksandrov" }).boundingBox();
    const about = await page.getByRole("region", { name: "About" }).boundingBox();

    expect((hero?.y ?? 0) + (hero?.height ?? 0) + 16).toBeCloseTo(about?.y ?? 0, 0);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("uses the design's mobile type sizes", async ({ page }) => {
    await page.goto("/en");

    const about = page.getByRole("region", { name: "About" });
    await expect(about.getByText(/^I'm a Senior Frontend Engineer/)).toHaveCSS("font-size", "17px");
    await expect(about.locator("strong")).toHaveCSS("font-size", "15px");
  });

  test("comes right after the contacts, without horizontal scroll", async ({ page }) => {
    await page.goto("/en");

    const contacts = await page.getByRole("list", { name: "Contacts" }).boundingBox();
    const about = await page.getByRole("region", { name: "About" }).boundingBox();

    expect(about?.y).toBeCloseTo((contacts?.y ?? 0) + (contacts?.height ?? 0) + 12, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()?.width);
  });
});
