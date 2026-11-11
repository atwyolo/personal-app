import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const navigation = (page: Page) => page.getByRole("navigation", { name: "Main navigation" });

const indicator = (page: Page) => navigation(page).locator(".nav-indicator");

const followAndSample = (page: Page, names: string[], interruptAfter = 0) =>
  page.evaluate(
    async ({ labels, delay }) => {
      const link = (label: string) => {
        const found = Array.from(document.querySelectorAll<HTMLAnchorElement>("nav a")).find(
          (anchor) => anchor.textContent === label,
        );
        if (!found) throw new Error(`no link ${label}`);

        return found;
      };
      const bar = document.querySelector(".nav-indicator");
      if (!bar) throw new Error("no indicator");

      const frames: { left: number; width: number }[] = [];
      const queue = [...labels];
      let current = queue.shift() as string;
      link(current).click();
      let became: number | null = null;
      let last = performance.now();

      await new Promise<void>((resolve) => {
        const frame = () => {
          const now = performance.now();
          const { left, width } = bar.getBoundingClientRect();
          frames.push({ left, width });

          if (became === null && link(current).hasAttribute("aria-current")) became = now;
          if (became !== null && queue.length > 0 && now - became >= delay) {
            current = queue.shift() as string;
            link(current).click();
            became = null;
            last = now;
          }
          if (became !== null && queue.length === 0) last = Math.max(last, became);

          if (queue.length > 0 || became === null || now - last < 900) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });

      return frames;
    },
    { labels: names, delay: interruptAfter },
  );

const readItems = (page: Page) =>
  navigation(page)
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => {
        const { x, width } = link.getBoundingClientRect();

        return { x, width };
      }),
    );

const openHydrated = async (page: Page) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-revealed", "");
};

const decoColor = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement("i");
    probe.className = "bg-deco";
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();

    return color;
  });

const expectUnder = async (page: Page, name: string) => {
  const link = navigation(page).getByRole("link", { name });
  await expect(link).toHaveAttribute("aria-current", "page");

  await expect
    .poll(async () => {
      const [bar, target] = await Promise.all([indicator(page).boundingBox(), link.boundingBox()]);

      return [bar?.x === target?.x, bar?.width === target?.width, bar?.y === (target?.y ?? 0) + (target?.height ?? 0) + 2];
    })
    .toEqual([true, true, true]);
};

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "the navigation is shown from lg");
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("the indicator sits under the current page, as wide as its item", async ({ page }) => {
    await page.goto("/en");

    await expectUnder(page, "Home");
  });

  test("it looks like the underline it replaces, and the link has none of its own", async ({ page }) => {
    await page.goto("/en");

    const link = navigation(page).getByRole("link", { name: "Home", exact: true });
    await expect(link).toHaveCSS("text-decoration-line", "none");
    await expect(indicator(page)).toHaveCSS("border-top-width", "3px");
    await expect(indicator(page)).toHaveCSS("border-top-color", await decoColor(page));
  });

  test("leaves the focus ring whole on the current item", async ({ page }) => {
    await openHydrated(page);
    const link = navigation(page).getByRole("link", { name: "Home" });

    await link.focus();
    await expect(link).toBeFocused();
    const box = await link.boundingBox();
    if (!box) throw new Error("no link box");
    const screenshot = await page.screenshot({
      clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 20 },
    });

    const yellow = await page.evaluate(async (source) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no canvas");
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, image.width, image.height);
      let pixels = 0;
      for (let index = 0; index < data.length; index += 4) {
        if (data[index] > 240 && data[index + 1] > 190 && data[index + 2] < 100) pixels += 1;
      }

      return pixels;
    }, screenshot.toString("base64"));

    expect(yellow).toBe(0);
  });

  test("slides to the next item instead of jumping", async ({ page }) => {
    await openHydrated(page);
    const [start] = await readItems(page);

    const frames = await followAndSample(page, ["Experience"]);

    await expectUnder(page, "Experience");
    const [, , target] = await readItems(page);
    const lefts = frames.map((frame) => frame.left);
    const between = lefts.filter((left) => left > start.x + 1 && left < target.x - 1);
    expect(between.length).toBeGreaterThan(3);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    const growing = frames.filter((frame) => frame.width > start.width + 0.5 && frame.width < target.width - 0.5);
    expect(growing.length).toBeGreaterThan(3);
  });

  test("turns around from where it is when another link interrupts it", async ({ page }) => {
    await openHydrated(page);
    await page.addStyleTag({ content: ".nav-indicator { transition-duration: 3s !important; }" });

    const frames = await followAndSample(page, ["Skills", "About"], 1500);

    await expectUnder(page, "About");
    const [, about, , skills] = await readItems(page);
    const lefts = frames.map((frame) => frame.left);
    const turn = Math.max(...lefts);
    expect(turn).toBeLessThan(skills.x - 1);
    expect(turn).toBeGreaterThan(about.x + 1);
    const steps = lefts.slice(1).map((left, index) => Math.abs(left - lefts[index]));
    expect(Math.max(...steps)).toBeLessThan(60);
  });

  test("keeps every item in place when the current page changes", async ({ page }) => {
    await openHydrated(page);
    const items = await readItems(page);

    for (const name of ["About", "Experience", "Skills"]) {
      await navigation(page).getByRole("link", { name }).click();
      await expect(navigation(page).getByRole("link", { name })).toHaveAttribute("aria-current", "page");

      expect(await readItems(page)).toEqual(items);
    }
  });

  test("hides on a path outside the navigation", async ({ page }) => {
    await page.goto("/en/no-such-page");

    await expect(navigation(page).locator('[aria-current="page"]')).toHaveCount(0);
    await expect(indicator(page)).toHaveCSS("opacity", "0");
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("moves at once", async ({ page }) => {
      await openHydrated(page);

      const frames = await followAndSample(page, ["Experience"]);

      await expectUnder(page, "Experience");
      expect(new Set(frames.map((frame) => frame.left)).size).toBeLessThanOrEqual(2);
    });
  });

  test.describe("in forced colors mode", () => {
    test.use({ forcedColors: "active" });

    test("keeps a visible mark on the current item, because the browser drops backgrounds there", async ({ page }) => {
      await page.goto("/en");

      const canvas = await page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.color = "Canvas";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();

        return color;
      });
      await expect(indicator(page)).toHaveCSS("border-top-style", "solid");
      await expect(indicator(page)).toHaveCSS("border-top-width", "3px");
      await expect(indicator(page)).not.toHaveCSS("border-top-color", canvas);
    });
  });

  test.describe("in a browser without anchor positioning", () => {
    test.beforeEach(async ({ page }) => {
      await page.route("**/en", async (route) => {
        const response = await route.fetch();
        const html = await response.text();
        const body = html.replaceAll("@supports (anchor-name:", "@supports (anchor-xame:");
        expect(body, "the stylesheet still holds the condition this test disables").not.toBe(html);

        await route.fulfill({ response, body });
      });
    });

    test("keeps the underline on the link", async ({ page }) => {
      await page.goto("/en");

      const link = navigation(page).getByRole("link", { name: "Home" });
      await expect(link).toHaveCSS("text-decoration-line", "underline");
      await expect(link).toHaveCSS("text-decoration-thickness", "3px");
      await expect(link).toHaveCSS("text-underline-offset", "8px");
      await expect(link).toHaveCSS("font-weight", "600");
    });

    test("shows no indicator and reserves no width", async ({ page }) => {
      await page.goto("/en");

      await expect(indicator(page)).toBeHidden();
      const reserved = await navigation(page)
        .getByRole("link", { name: "About" })
        .evaluate((link) => getComputedStyle(link, "::after").content);
      expect(reserved).toBe("none");
    });

    test("does not pin the bar to a link", async ({ page }) => {
      await page.goto("/en");

      const anchored = await navigation(page)
        .getByRole("link", { name: "Home" })
        .evaluate((link) => getComputedStyle(link).getPropertyValue("anchor-name"));
      expect(anchored).toBe("none");
    });
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout only");

  test("the menu keeps the underline on the current page", async ({ page }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Open menu" }).click();

    const link = page.getByRole("dialog", { name: "Main navigation" }).getByRole("link", { name: "Home" });
    await expect(link).toHaveCSS("text-decoration-line", "underline");
    await expect(link).toHaveCSS("text-decoration-thickness", "3px");
  });
});
