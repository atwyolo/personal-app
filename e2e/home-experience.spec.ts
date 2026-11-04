import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const getCarousel = (page: Page) => page.getByRole("group", { name: "Experience" });
const getTrack = (page: Page) => getCarousel(page).getByRole("group", { name: "1 of 3" }).locator("..");

const recordScrollToSecondCard = async (page: Page, secondCard: number) => {
  const next = await getCarousel(page).getByRole("button", { name: "Next" }).elementHandle();

  return getTrack(page).evaluate(
    async (track, { button, target }) => {
      const offsets: number[] = [];
      (button as HTMLElement).click();

      do {
        offsets.push(track.scrollLeft);
        await new Promise(requestAnimationFrame);
      } while (track.scrollLeft < target && offsets.length < 240);

      return [...offsets, track.scrollLeft];
    },
    { button: next, target: secondCard },
  );
};

const swipeToNextCard = async (page: Page) => {
  await getCarousel(page).getByRole("group", { name: "1 of 3" }).scrollIntoViewIfNeeded();

  const client = await page.context().newCDPSession(page);
  const box = await getTrack(page).boundingBox();
  await client.send("Input.synthesizeScrollGesture", {
    x: box!.x + box!.width / 2,
    y: box!.y + 200,
    xDistance: -box!.width * 0.6,
    gestureSourceType: "touch",
  });
};

const goToCard = async (page: Page, card: number, step: number) => {
  for (let position = 2; position <= card; position += 1) {
    await getCarousel(page).getByRole("button", { name: "Next" }).click();
    await expect(getCarousel(page).getByText(`${position} / 3`)).toBeVisible();
  }

  await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe((card - 1) * step);
};

const waitForResizeObservers = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

const switchSnapOff = (page: Page) =>
  getTrack(page).evaluate((track) => {
    track.style.scrollSnapType = "none";
  });

test("shows the jobs from the content files in their order", async ({ page }) => {
  await page.goto("/en");

  const section = page.getByRole("region", { name: "Experience" });
  await expect(section.getByRole("heading", { level: 2, name: "Experience" })).toBeVisible();
  await expect(section.getByRole("heading", { level: 3 })).toHaveText(["Glovo", "Sony PlayStation", "EPAM"]);
  await expect(section.getByText("11/2024 – 10/2026 · 2 years")).toBeVisible();
  await expect(section.getByRole("article").first().getByRole("listitem")).not.toHaveCount(0);
});

test.describe("when an image fails to load", () => {
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("frames the image area with the placeholder", async ({ page, isMobile }) => {
    await page.route("**/_next/image**", (route) => route.fulfill({ status: 404 }));
    await page.goto("/en");

    const placeholder = page.getByRole("region", { name: "Experience" }).getByRole("img", { name: "Glovo" });
    await expect.poll(() => placeholder.evaluate((element) => element.tagName)).toBe("DIV");
    await expect(placeholder).toHaveCSS("border-top-style", "dashed");
    await expect(placeholder).toHaveCSS("border-top-left-radius", "14px");
    await expect(placeholder).toHaveCSS("background-image", /^repeating-linear-gradient\(135deg,.* 1px, .* 10px\)$/);

    const box = await placeholder.boundingBox();
    expect(box!.width).toBeCloseTo(isMobile ? 332 : 359.33, 1);
    expect(box!.height).toBe(isMobile ? 140 : 180);
  });
});

test("keeps the current locale in the links", async ({ page }) => {
  await page.goto("/de");

  const section = page.getByRole("region", { name: "Experience" });
  await expect(section.getByRole("link", { name: "Learn more" }).first()).toHaveAttribute("href", "/de/experience#glovo");
  await expect(section.getByRole("link", { name: "All experience" })).toHaveAttribute("href", "/de/experience");
});

test("styles all experience as the primary pill", async ({ page }) => {
  await page.goto("/en");

  const link = page.getByRole("region", { name: "Experience" }).getByRole("link", { name: "All experience" });
  await expect(link).toHaveCSS("height", "44px");
  await expect(link).toHaveCSS("text-decoration-line", "none");

  const radius = await link.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderTopLeftRadius));
  expect(radius).toBeGreaterThanOrEqual(22);
});

test("pins learn more to the bottom of every card", async ({ page }) => {
  await page.goto("/en");

  const links = page.getByRole("region", { name: "Experience" }).getByRole("link", { name: "Learn more" });
  const bottoms = await links.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().bottom));

  expect(new Set(bottoms).size).toBe(1);
});

test.describe("desktop layout", () => {
  test.skip(({ isMobile }) => isMobile, "the grid starts at lg");

  test("puts the cards in one row of equal height and the pill on the right", async ({ page }) => {
    await page.goto("/en");

    const section = page.getByRole("region", { name: "Experience" });
    const boxes = await section.getByRole("article").evaluateAll((cards) =>
      cards.map((card) => {
        const { top, height } = card.getBoundingClientRect();
        return { top, height };
      }),
    );

    expect(boxes).toHaveLength(3);
    expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
    expect(new Set(boxes.map((box) => box.height)).size).toBe(1);

    const sectionBox = await section.boundingBox();
    const pillBox = await section.getByRole("link", { name: "All experience" }).boundingBox();
    expect(pillBox!.x + pillBox!.width).toBeCloseTo(sectionBox!.x + sectionBox!.width, 0);
    expect(pillBox!.width).toBeLessThan(sectionBox!.width / 2);
  });

  test("hides the carousel controls and does not scroll sideways", async ({ page }) => {
    await page.goto("/en");

    const carousel = page.getByRole("group", { name: "Experience" });
    await expect(carousel.getByText("1 / 3")).toBeHidden();
    await expect(carousel.getByRole("button", { name: "Next" })).toBeHidden();

    const track = carousel.getByRole("group", { name: "1 of 3" }).locator("..");
    await expect(track).toHaveCSS("display", "grid");
    await expect(track).toHaveCSS("scroll-snap-type", "none");
  });

  test("loads a file as wide as the image scaled by its height", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/en");

    const image = page.getByRole("region", { name: "Experience" }).getByRole("img", { name: "Glovo" });
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);

    const file = await image.evaluate((element: HTMLImageElement) => new URL(element.currentSrc).searchParams.get("w"));
    expect(Number(file)).toBeGreaterThanOrEqual(320);
  });
});

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout");

  test("shows one card with the position and the arrows above it", async ({ page }) => {
    await page.goto("/en");

    const carousel = getCarousel(page);
    const position = carousel.getByText("1 / 3");
    const firstCard = getCarousel(page).getByRole("group", { name: "1 of 3" });
    await firstCard.scrollIntoViewIfNeeded();
    await expect(position).toBeVisible();
    await expect(firstCard).toBeInViewport();
    await expect(getCarousel(page).getByRole("group", { name: "2 of 3" })).not.toBeInViewport();

    const positionBox = await position.boundingBox();
    const cardBox = await firstCard.boundingBox();
    expect(positionBox!.y).toBeLessThan(cardBox!.y);
    expect(cardBox!.width).toBe(358);

    const next = carousel.getByRole("button", { name: "Next" });
    await expect(next).toHaveCSS("height", "44px");
    await expect(next).toHaveCSS("width", "44px");
    await expect(next).toHaveCSS("opacity", "1");
    await expect(carousel.getByRole("button", { name: "Previous" })).toHaveCSS("opacity", "0.35");
  });

  test("gives every card the same height", async ({ page }) => {
    await page.goto("/en");

    const heights = await getCarousel(page)
      .getByRole("article")
      .evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().height));

    expect(heights).toHaveLength(3);
    expect(new Set(heights).size).toBe(1);
  });

  test("moves between cards with the arrows, up to the last one", async ({ page }) => {
    await page.goto("/en");

    const carousel = getCarousel(page);
    const next = carousel.getByRole("button", { name: "Next" });

    for (const position of ["2 / 3", "3 / 3"]) {
      await next.click();
      await expect(carousel.getByText(position)).toBeVisible();
      await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft % 370)).toBe(0);
    }

    await expect(getCarousel(page).getByRole("group", { name: "3 of 3" })).toBeInViewport();
    await expect(next).toHaveAttribute("aria-disabled", "true");

    await carousel.getByRole("button", { name: "Previous" }).click();
    await expect(carousel.getByText("2 / 3")).toBeVisible();
  });

  test("snaps to the next card and updates the position after a swipe", async ({ page }) => {
    await page.goto("/en");

    const firstCard = await getCarousel(page).getByRole("group", { name: "1 of 3" }).boundingBox();

    await swipeToNextCard(page);

    await expect(getCarousel(page).getByText("2 / 3")).toBeVisible();
    await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe(firstCard!.width + 12);
  });

  test.describe("at a tablet width", () => {
    test.use({ viewport: { width: 720, height: 900 } });

    test("snaps to the next card after a swipe", async ({ page }) => {
      await page.goto("/en");

      await swipeToNextCard(page);

      await expect(getCarousel(page).getByText("2 / 3")).toBeVisible();
      await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe(700);
    });
  });

  test("stays on the card when the phone turns to landscape", async ({ page }) => {
    await page.goto("/en");
    await goToCard(page, 2, 370);
    await switchSnapOff(page);

    await page.setViewportSize({ width: 844, height: 390 });

    await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe(700);
    await expect(getCarousel(page).getByText("2 / 3")).toBeVisible();
  });

  test("stays on the card when the phone turns back to portrait", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/en");
    await goToCard(page, 2, 700);
    await switchSnapOff(page);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe(370);
    await expect(getCarousel(page).getByText("2 / 3")).toBeVisible();
  });

  test("keeps the card when an iPad turns across lg and back", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1100 });
    await page.goto("/en");
    await goToCard(page, 3, 700);

    await page.setViewportSize({ width: 1100, height: 800 });
    await expect(getTrack(page)).toHaveCSS("display", "grid");
    await waitForResizeObservers(page);
    await page.setViewportSize({ width: 800, height: 1100 });
    await waitForResizeObservers(page);

    expect(await getTrack(page).evaluate((track) => track.scrollLeft)).toBe(1400);
    await expect(getCarousel(page).getByText("3 / 3")).toBeVisible();
  });

  test("keeps the focus on an arrow when it turns off", async ({ page }) => {
    await page.goto("/en");

    const carousel = getCarousel(page);
    const next = carousel.getByRole("button", { name: "Next" });
    for (const position of ["2 / 3", "3 / 3"]) {
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(carousel.getByText(position)).toBeVisible();
    }

    await expect(next).toBeFocused();
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveCSS("opacity", "1");
  });

  test("follows the keyboard focus into a card that is off screen", async ({ page }) => {
    await page.goto("/en");

    const carousel = getCarousel(page);
    await carousel.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await expect(getCarousel(page).getByRole("group", { name: "2 of 3" }).getByRole("link", { name: "Learn more" })).toBeFocused();
    await expect(carousel.getByText("2 / 3")).toBeVisible();
  });

  test("animates the way to the next card", async ({ page }) => {
    await page.goto("/en");

    const offsets = await recordScrollToSecondCard(page, 370);

    expect(offsets.some((offset) => offset > 0 && offset < 370)).toBe(true);
    expect(offsets.at(-1)).toBe(370);
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("jumps to the next card", async ({ page }) => {
      await page.goto("/en");

      const offsets = await recordScrollToSecondCard(page, 370);

      expect(offsets.every((offset) => offset === 370)).toBe(true);
    });
  });

  test("does not widen the page", async ({ page }) => {
    await page.goto("/en");

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()?.width);
  });

  test("stretches the pill over the whole block", async ({ page }) => {
    await page.goto("/en");

    const section = page.getByRole("region", { name: "Experience" });
    const sectionBox = await section.boundingBox();
    const pillBox = await section.getByRole("link", { name: "All experience" }).boundingBox();

    expect(pillBox!.width).toBe(sectionBox!.width);
  });
});

for (const width of [720, 1023]) {
  test.describe(`tablet layout at ${width} px`, () => {
    test.skip(({ isMobile }) => isMobile, "a width needs only one browser");
    test.use({ viewport: { width, height: 900 } });

    test("shows one card with the carousel controls", async ({ page }) => {
      await page.goto("/en");

      const firstCard = getCarousel(page).getByRole("group", { name: "1 of 3" });
      await firstCard.scrollIntoViewIfNeeded();
      await expect(firstCard).toBeInViewport();
      await expect(getCarousel(page).getByRole("group", { name: "2 of 3" })).not.toBeInViewport();
      await expect(getCarousel(page).getByText("1 / 3")).toBeVisible();
      await expect(getCarousel(page).getByRole("button", { name: "Next" })).toBeVisible();

      const box = await firstCard.boundingBox();
      expect(box!.width).toBe(688);
    });

    test("moves one whole card with the next arrow", async ({ page }) => {
      await page.goto("/en");

      await getCarousel(page).getByRole("button", { name: "Next" }).click();

      await expect(getCarousel(page).getByText("2 / 3")).toBeVisible();
      await expect.poll(() => getTrack(page).evaluate((track) => track.scrollLeft)).toBe(700);
    });

    test("loads a file as wide as the image", async ({ page }) => {
      await page.goto("/en");

      const image = page.getByRole("region", { name: "Experience" }).getByRole("img", { name: "Glovo" });
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);

      expect(await image.boundingBox()).toMatchObject({ width: 662, height: 140 });
      const file = await image.evaluate((element: HTMLImageElement) => new URL(element.currentSrc).searchParams.get("w"));
      expect(Number(file)).toBeGreaterThanOrEqual(662);
    });

    test("does not widen the page", async ({ page }) => {
      await page.goto("/en");

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  });
}
