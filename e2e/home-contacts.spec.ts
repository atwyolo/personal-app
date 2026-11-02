import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// Contact buttons: stacked under the photo, links built from the profile. The CV is checked by its URL only:
// downloading it would hit Blob on every run.
test("lists WhatsApp, mail, LinkedIn and the CV in that order", async ({ page }) => {
  await page.goto("/en");

  const links = page.getByRole("list", { name: "Contacts" }).getByRole("link");
  await expect(links).toHaveText([/WhatsApp/, /mikhail\.aleksandrov\.job/, /LinkedIn/, /Download CV/]);
});

test("links to the owner's channels", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("link", { name: "WhatsApp: +374 93 310039" })).toHaveAttribute(
    "href",
    "https://wa.me/37493310039",
  );
  await expect(page.getByRole("link", { name: "Mail: mikhail.aleksandrov.job@gmail.com" })).toHaveAttribute(
    "href",
    "mailto:mikhail.aleksandrov.job@gmail.com",
  );
  await expect(page.getByRole("link", { name: "LinkedIn profile" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/mikhail-aleksandrov-job",
  );
});

test("opens WhatsApp and LinkedIn in a new tab, safely", async ({ page }) => {
  await page.goto("/en");

  for (const name of ["WhatsApp: +374 93 310039", "LinkedIn profile"]) {
    const link = page.getByRole("link", { name });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

const CHANNELS = ["WhatsApp: +374 93 310039", "Mail: mikhail.aleksandrov.job@gmail.com", "LinkedIn profile"];

/** The computed value of a theme token. A variable, not a utility class: Tailwind scans this file and would ship the class. */
const themeColor = (page: Page, token: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const { color } = getComputedStyle(probe);
    probe.remove();

    return color;
  }, token);

const channel = (page: Page, name: string) => page.getByRole("link", { name, exact: true });

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ page }) => {
      await page.goto("/en");
      // The tokens below are read from the page, so this is what proves the theme really changed.
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${colorScheme}\\b`));
    });

    test("the three channels are identical cards in theme colors", async ({ page }) => {
      const card = await themeColor(page, "--card");
      const foreground = await themeColor(page, "--foreground");
      const line = await themeColor(page, "--card-border");

      for (const name of CHANNELS) {
        const link = channel(page, name);
        await expect(link).toHaveCSS("background-color", card);
        await expect(link).toHaveCSS("color", foreground);
        await expect(link).toHaveCSS("border-top-width", "1px");
        await expect(link).toHaveCSS("border-top-color", line);
      }
    });

    test("their icon and arrow are in the accent color", async ({ page }) => {
      const brand = await themeColor(page, "--brand");

      for (const name of CHANNELS) {
        const [icon, arrow] = await channel(page, name).locator("svg").all();
        await expect(icon).toHaveCSS("color", brand);
        await expect(icon).toHaveCSS("width", "26px");
        await expect(arrow).toHaveCSS("color", brand);
        await expect(arrow).toHaveCSS("width", "18px");
      }
    });

    test("Download CV stays the filled primary button", async ({ page }) => {
      const primary = await themeColor(page, "--primary");
      const cv = page.getByRole("link", { name: "Download CV PDF" });

      await expect(cv).toHaveCSS("background-color", primary);
      await expect(cv).toHaveCSS("border-top-color", primary);
      await expect(cv).toHaveCSS("color", await themeColor(page, "--primary-foreground"));
    });
  });
}

test("the marks of all four buttons line up on their centers", async ({ page }) => {
  await page.goto("/en");

  const centers = await page
    .getByRole("list", { name: "Contacts" })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => {
        const icon = link.querySelector("svg");
        if (!icon) throw new Error("a button without a mark");
        const { left, width } = icon.getBoundingClientRect();

        return left + width / 2;
      }),
    );

  expect(centers).toHaveLength(4);
  expect(new Set(centers).size).toBe(1);
});

test.describe("on hover", () => {
  test.skip(({ isMobile }) => isMobile, "a touch screen has no hover");

  test("a channel only gets the accent border, nothing moves (owner's decision)", async ({ page }) => {
    await page.goto("/en");
    const brand = await themeColor(page, "--brand");

    for (const name of CHANNELS) {
      const link = channel(page, name);
      await link.hover();

      await expect(link).toHaveCSS("border-top-color", brand);
      await expect(link).toHaveCSS("translate", "none");
      await expect(link).toHaveCSS("box-shadow", "none");
      await expect(link.locator("svg").last()).toHaveCSS("translate", "none");
    }
  });

  test("Download CV does not move either", async ({ page }) => {
    await page.goto("/en");
    const cv = page.getByRole("link", { name: "Download CV PDF" });

    await cv.hover();

    await expect(cv).toHaveCSS("translate", "none");
  });
});

test("points the CV button at the blob download URL", async ({ page }) => {
  await page.goto("/en");

  const cv = page.getByRole("link", { name: "Download CV PDF" });
  await expect(cv).toHaveAttribute("href", /\.vercel-storage\.com\/.+\.pdf\?download=1$/);
  await expect(cv).not.toHaveAttribute("target");
});

test("keeps every button 56px tall in the design frames", async ({ page }) => {
  await page.goto("/en");

  const links = page.getByRole("list", { name: "Contacts" }).getByRole("link");
  await expect(links).toHaveCount(4);
  for (const link of await links.all()) {
    expect((await link.boundingBox())?.height).toBe(56);
  }
});

test("does not widen the page", async ({ page }) => {
  await page.goto("/en");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()?.width);
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the four-column grid starts at lg");

  test("sits in column 1 under the photo", async ({ page }) => {
    await page.goto("/en");

    const photo = await page.getByRole("img", { name: "Mikhail Aleksandrov" }).locator("..").boundingBox();
    const box = await page.getByRole("list", { name: "Contacts" }).boundingBox();
    expect(box?.x).toBeCloseTo(20, 0);
    expect(box?.width).toBeCloseTo(288, 0);
    expect(box?.y).toBeCloseTo((photo?.y ?? 0) + (photo?.height ?? 0) + 16, 0);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("spans the content width right after the photo", async ({ page }) => {
    await page.goto("/en");

    const photo = await page.getByRole("img", { name: "Mikhail Aleksandrov" }).locator("..").boundingBox();
    const box = await page.getByRole("list", { name: "Contacts" }).boundingBox();
    expect(box?.x).toBe(16);
    expect(box?.width).toBe(390 - 16 * 2);
    expect(box?.y).toBeCloseTo((photo?.y ?? 0) + (photo?.height ?? 0) + 12, 0);
  });
});
