import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const SCALE_OPEN = "matrix(0, 0, 0, 1, 0, 0)";
const SCALE_COVERED = "matrix(1, 0, 0, 1, 0, 0)";

/** Pseudo-element styles of every block with the wipe, in DOM order. */
const readShutters = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("main .reveal")).map((element) => {
      const style = getComputedStyle(element, "::after");

      return {
        overflow: getComputedStyle(element).overflow,
        content: style.content,
        name: style.animationName,
        duration: style.animationDuration,
        delay: style.animationDelay,
        easing: style.animationTimingFunction,
        iterations: style.animationIterationCount,
        transform: style.transform,
        zIndex: style.zIndex,
        side: parseFloat(style.transformOrigin) === 0 ? "left" : "right",
      };
    }),
  );

/** Stops every wipe at the given moment, so a test can look at the page mid-animation. */
const freezeWipe = (page: Page, currentTime: number) =>
  page.evaluate((time) => {
    for (const animation of document.getAnimations()) {
      if ((animation as CSSAnimation).animationName !== "wipe") continue;
      animation.pause();
      animation.currentTime = time;
    }
  }, currentTime);

// The tests read properties, not the demo content: the owner replaces it in the admin.
test.describe("wipe on load", () => {
  // Without JavaScript the wipe stays switched on, so a test can read it however long the page takes.
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("covers the first screen, every contact, every card and the skills", async ({ page }) => {
    const main = page.locator("main");
    const contacts = await main.locator("ul[aria-label] a").count();
    const cards = await main.locator("article").count();
    // The block is not rendered without marked skills.
    const skills = await main.locator('section[aria-labelledby="skills-title"]').count();

    await expect(main.locator('section[aria-labelledby="hero-title"].reveal')).toHaveCount(1);
    await expect(main.locator('section[aria-labelledby="about-title"].reveal')).toHaveCount(1);
    // `role="img"` is the placeholder of a missing photo.
    await expect(main.locator('.reveal:not(article):has(img, [role="img"])')).toHaveCount(1);
    await expect(main.locator("ul[aria-label] a.reveal")).toHaveCount(contacts);
    await expect(main.locator("article.reveal")).toHaveCount(cards);
    await expect(main.locator('section[aria-labelledby="skills-title"] > .reveal')).toHaveCount(skills);

    // Hero, photo, About and nothing else: section headers, pills and carousel controls have no shutter.
    await expect(main.locator(".reveal")).toHaveCount(3 + skills + contacts + cards);
  });

  test("covers the header without taking it out of the sticky position", async ({ page }) => {
    const header = page.locator("header");

    await expect(header).toHaveClass(/\breveal\b/);
    await expect(header).toHaveCSS("position", "sticky");
    await expect(header).toHaveCSS("overflow", "clip");

    const name = await header.evaluate((element) => getComputedStyle(element, "::after").animationName);

    expect(name).toBe("wipe");
  });

  test("leaves the carousel itself alone", async ({ page }) => {
    const carousel = page.locator('main [aria-roledescription="carousel"]').first();

    // `overflow: clip` on the track would stop the swipe.
    await expect(carousel).not.toHaveClass(/\breveal\b/);
    await expect(carousel.locator(".snap-x.reveal, .snap-start.reveal")).toHaveCount(0);
  });

  test("plays the same animation on every block", async ({ page }) => {
    const shutters = await readShutters(page);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) {
      expect(shutter).toMatchObject({
        name: "wipe",
        duration: "0.7s",
        delay: "0.15s",
        easing: "cubic-bezier(0.75, 0, 0.2, 1)",
        iterations: "1",
      });
    }
  });

  test("clips every block without making it a scroll container", async ({ page }) => {
    const shutters = await readShutters(page);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) expect(shutter.overflow).toBe("clip");
  });

  test("keeps a block covered during the delay", async ({ page }) => {
    await freezeWipe(page, 100);

    const shutters = await readShutters(page);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) expect(shutter.transform).toBe(SCALE_COVERED);
  });

  test("opens every block for good", async ({ page }) => {
    await freezeWipe(page, 850);

    const shutters = await readShutters(page);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) expect(shutter.transform).toBe(SCALE_OPEN);
  });

  test("alternates the direction", async ({ page }) => {
    const sides = (await readShutters(page)).map((shutter) => shutter.side);

    expect(sides.length).toBeGreaterThan(1);
    // Hero and photo come first in the DOM.
    expect(sides.slice(0, 2)).toEqual(["right", "left"]);

    const groups = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main ul:has(a.reveal), main [aria-roledescription="carousel"]')).map(
        (group) =>
          Array.from(group.querySelectorAll(".reveal")).map((block) =>
            getComputedStyle(block, "::after").transformOrigin.startsWith("0px"),
          ),
      ),
    );

    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      group.slice(1).forEach((isLeft, index) => expect(isLeft).not.toBe(group[index]));
    }
  });

  test("keeps the header above the shutter of a block", async ({ page }) => {
    const [shutter] = await readShutters(page);
    const header = await page.locator("header").evaluate((element) => Number(getComputedStyle(element).zIndex));
    const block = await page.locator("main .reveal").first().evaluate((element) => getComputedStyle(element).zIndex);

    expect(block).toBe("auto");
    expect(Number(shutter.zIndex)).toBeLessThan(header);
  });

  test("lets a click through a closed shutter", async ({ page }) => {
    await freezeWipe(page, 100);

    const link = page.locator("main article a").first();

    await link.scrollIntoViewIfNeeded();
    await link.click({ trial: true, timeout: 2_000 });
  });
});

/** Records the time of every wipe that starts on the page; a full load starts the list again. */
const recordWipes = (page: Page) =>
  page.addInitScript(() => {
    const record = window as unknown as { wipes: number[] };

    record.wipes = [];
    document.addEventListener("animationstart", (event) => {
      if (event.animationName === "wipe") record.wipes.push(event.timeStamp);
    });
  });

const readWipes = (page: Page) => page.evaluate(() => (window as unknown as { wipes: number[] }).wipes);

const countWipes = async (page: Page) => (await readWipes(page)).length;

/** Leaves the home page through client navigation. */
const leaveHome = async (page: Page) => {
  await page.locator('section[aria-labelledby="about-title"] a').click();
  await page.waitForURL("**/en/about");
};

const switchToRussian = async (page: Page) => {
  await page.locator("header button").first().click();
  await page.getByRole("menuitemradio", { name: /Русский/ }).click();
  await page.waitForURL("**/ru");
  await expect(page.locator("html[lang=ru]")).toBeAttached();
};

test.describe("once per page load", () => {
  test.beforeEach(async ({ page }) => {
    await recordWipes(page);
    await page.goto("/en");
    await expect(page.locator("html[data-revealed]")).toBeAttached();
  });

  test("starts every block and the header together", async ({ page }) => {
    const blocks = await page.locator(".reveal").count();
    const wipes = await readWipes(page);

    expect(blocks).toBeGreaterThan(1);
    expect(wipes).toHaveLength(blocks);
    expect(Math.max(...wipes) - Math.min(...wipes)).toBeLessThan(50);
  });

  test("removes the shutter when it has played", async ({ page }) => {
    const shutters = await readShutters(page);
    const header = await page.locator("header").evaluate((element) => getComputedStyle(element, "::after").content);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) expect(shutter).toMatchObject({ content: "none", name: "none" });
    expect(header).toBe("none");
  });

  test("does not play again when the visitor comes back through a link", async ({ page }) => {
    const played = await countWipes(page);

    await leaveHome(page);
    await page.locator("header a").first().click();
    await page.waitForURL("**/en");
    await expect(page.locator("#hero-title")).toBeVisible();
    // Longer than the delay of the wipe, which is when `animationstart` fires.
    await page.waitForTimeout(400);

    expect(await countWipes(page)).toBe(played);
  });

  test("does not play again after the back button", async ({ page }) => {
    const played = await countWipes(page);

    await leaveHome(page);
    await page.goBack();
    await page.waitForURL("**/en");
    await expect(page.locator("#hero-title")).toBeVisible();
    await page.waitForTimeout(400);

    expect(await countWipes(page)).toBe(played);
  });

  test("does not play again after a language switch", async ({ page }) => {
    const played = await countWipes(page);

    await switchToRussian(page);
    await page.waitForTimeout(400);

    expect(await countWipes(page)).toBe(played);
  });

  test("does not flash the shutter during a language switch", async ({ page }) => {
    // `animationstart` fires after the delay, but the shutter covers the block during it: only a frame shows that.
    await page.evaluate(() => {
      const record = window as unknown as { shutters: string[] };

      record.shutters = [];

      const sample = () => {
        const header = document.querySelector("header");

        if (header) record.shutters.push(getComputedStyle(header, "::after").content);
        requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
    });

    await switchToRussian(page);
    await page.waitForTimeout(100);

    const frames = await page.evaluate(() => (window as unknown as { shutters: string[] }).shutters);

    expect(frames.length).toBeGreaterThan(0);
    expect(new Set(frames)).toEqual(new Set(["none"]));
  });

  test("plays again after a reload", async ({ page }) => {
    const blocks = await page.locator(".reveal").count();

    await page.reload();

    await expect.poll(() => countWipes(page)).toBe(blocks);
  });

  test("does not shift the layout", async ({ page }) => {
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) total += (entry as unknown as { value: number }).value;
          }).observe({ type: "layout-shift", buffered: true });

          setTimeout(() => resolve(total), 100);
        }),
    );

    expect(shift).toBeLessThan(0.01);
  });
});

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("shows every block without a shutter", async ({ page }) => {
    await page.goto("/en");

    const shutters = await readShutters(page);

    expect(shutters.length).toBeGreaterThan(0);
    for (const shutter of shutters) expect(shutter).toMatchObject({ content: "none", name: "none" });
  });
});
