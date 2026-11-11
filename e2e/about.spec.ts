import { expect, test } from "./fixtures";
import { messagesFor } from "./messages";

import type { Locale } from "@/shared/lib/locales";

const sections = (page: import("@playwright/test").Page) => page.locator("main section[id]");

const chips = (page: import("@playwright/test").Page, locale: Locale = "en") =>
  page.getByRole("navigation", { name: messagesFor(locale)("Pages.About.questionsNav") }).filter({ visible: true });

const expectBelowBars = async (page: import("@playwright/test").Page, slug: string, locale: Locale = "en") => {
  await expect(async () => {
    const bar = await chips(page, locale).boundingBox();
    const heading = await page.locator(`#${slug} h2`).filter({ visible: true }).boundingBox();
    const viewport = page.viewportSize();

    expect(heading!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
    expect(heading!.y).toBeLessThan(viewport!.height / 2);
  }).toPass({ timeout: 3000 });
};

const questions = [
  "Who are you, in two sentences?",
  "How do you like to work?",
  "What results are you proud of?",
  "What kind of teams have you worked in?",
  "What are you looking for next?",
  "And outside of work?",
];

test.describe("about page", () => {
  test("shows the hero", async ({ page }) => {
    await page.goto("/en/about");

    await expect(page.getByRole("heading", { level: 1, name: "About me" })).toBeVisible();
    await expect(
      page.getByText("A short interview with myself: the questions recruiters ask most, answered properly."),
    ).toBeVisible();
  });

  test("goes straight from the back link to the title, 30 px apart", async ({ page }) => {
    await page.goto("/en/about");

    const link = await page.getByRole("link", { name: "Back" }).boundingBox();
    const heading = await page.getByRole("heading", { level: 1, name: "About me" }).boundingBox();

    expect(heading!.y - (link!.y + link!.height)).toBe(30);
    await expect(page.locator("main").getByText("About", { exact: true })).toHaveCount(0);
  });

  test("makes the label the larger line of a question", async ({ page, isMobile }) => {
    await page.goto("/en/about");

    const label = page.locator("#who").getByText("Who I am", { exact: true });
    const question = page.locator("#who h2");

    await expect(label).toHaveCSS("font-size", isMobile ? "16px" : "18px");
    await expect(label).toHaveCSS("font-weight", "600");
    await expect(label).toHaveCSS("text-transform", "none");
    await expect(question).toHaveCSS("font-size", isMobile ? "13px" : "14px");
    await expect(question).toHaveCSS("font-weight", "400");
  });

  test("renders the pairs in reading order", async ({ page }) => {
    await page.goto("/en/about");

    await expect(sections(page).getByRole("heading", { level: 2 })).toHaveText(questions);
    const ids = await sections(page).evaluateAll((items) => items.map((item) => item.id));
    expect(ids).toEqual(["who", "how", "results", "scale", "next", "life"]);
  });

  test("shows the label and a decorative avatar in a pair", async ({ page }) => {
    await page.goto("/en/about");

    const pair = page.locator("#who");
    await expect(pair.getByText("Who I am", { exact: true })).toBeVisible();
    await expect(
      pair.getByText("I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js."),
    ).toBeVisible();

    const avatar = pair.locator('[aria-hidden="true"]', { hasText: "MA" });
    await expect(avatar).toBeVisible();
  });

  test("renders the rich text of an answer", async ({ page }) => {
    await page.goto("/en/about");

    const items = page.locator("#results").getByRole("listitem");
    await expect(items).toHaveCount(3);
    await expect(items.first()).toContainText("At EPAM, I helped migrate");
  });

  test("has its own title and canonical address", async ({ page }) => {
    await page.goto("/en/about");

    await expect(page).toHaveTitle("About — Mikhail Aleksandrov");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe("/en/about");
  });

  test("describes the person for search engines", async ({ page }) => {
    await page.goto("/en/about");

    const script = page.locator('script[type="application/ld+json"]');
    await expect(script).toHaveCount(1);

    const data = JSON.parse((await script.textContent())!);
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        "@id": "http://localhost:3100/#person",
        name: "Mikhail Aleksandrov",
        jobTitle: "Senior Frontend Software Engineer",
        url: "http://localhost:3100/",
        image: "https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/e2e/photo.jpg",
        sameAs: ["https://www.linkedin.com/in/mikhail-aleksandrov-job"],
      },
    });
  });

  test("falls back to the English pairs in a locale without translations", async ({ page }) => {
    await page.goto("/ru/about");

    await expect(page.locator("html[lang=ru]")).toBeAttached();
    await expect(sections(page).getByRole("heading", { level: 2 })).toHaveText(questions);
  });

  test("stays on the page when the language changes", async ({ page }) => {
    await page.goto("/en/about");

    await page.locator("header button").first().click();
    await page.getByRole("menuitemradio", { name: /Русский/ }).click();

    await page.waitForURL("**/ru/about");
    await expect(sections(page).filter({ visible: true })).toHaveCount(questions.length);
  });

  test("goes home from the back link on a direct visit", async ({ page }) => {
    await page.goto("/en/about");

    await page.getByRole("link", { name: "Back" }).click();

    await page.waitForURL("**/en");
    await expect(page.getByRole("region", { name: "About" })).toBeVisible();
  });

  test("goes home from the back link without a reload", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => {
      (window as unknown as { sameDocument: boolean }).sameDocument = true;
    });

    await page.getByRole("region", { name: "About" }).getByRole("link", { name: "Read more" }).click();
    await page.waitForURL("**/en/about");
    await page.getByRole("link", { name: "Back" }).click();
    await page.waitForURL("**/en");

    await expect(page.getByRole("region", { name: "About" })).toBeVisible();
    const sameDocument = await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument);
    expect(sameDocument).toBe(true);
  });

  test("never leaves the site through the back link", async ({ page }) => {
    await page.goto("about:blank");
    await page.goto("/en/about");
    await page.locator("header a").first().click();
    await page.waitForURL("**/en");
    await page.goBack();
    await page.waitForURL("**/en/about");

    await page.getByRole("link", { name: "Back" }).click();

    await page.waitForURL("**/en");
  });

  test("keeps the language in the back link", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("region", { name: "About" }).getByRole("link", { name: "Read more" }).click();
    await page.waitForURL("**/en/about");
    await page.locator("header button").first().click();
    await page.getByRole("menuitemradio", { name: /Русский/ }).click();
    await page.waitForURL("**/ru/about");

    await page.getByRole("link", { name: messagesFor("ru")("Pages.Common.back") }).filter({ visible: true }).click();

    await page.waitForURL("**/ru");
  });

  test("does not scroll sideways on a 320 px phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/en/about");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBe(clientWidth);
  });

  test("breaks a long word instead of widening the page", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/en/about");

    const scrollWidth = await page.evaluate(() => {
      const word = "Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz";
      document.querySelector("#who h2")!.textContent = word;
      document.querySelector("#who p:last-of-type")!.textContent = word;
      return document.documentElement.scrollWidth;
    });

    expect(scrollWidth).toBe(320);
  });
});

test.describe("scroll on the site", () => {
  test("is not animated site-wide, so a history step restores its position at once", async ({ page }) => {
    await page.goto("/en");

    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);

    expect(scrollBehavior).toBe("auto");
  });
});

test.describe("reveal on scroll", () => {
  const question = (page: import("@playwright/test").Page, slug: string) =>
    page.locator(`#${slug} > div`).filter({ visible: true }).first();

  const settled = (page: import("@playwright/test").Page) => page.waitForTimeout(700);

  test("shows the last section on a window too tall for it to reach the line", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1800 });
    await page.goto("/en/about");
    await expect(page.locator("[data-reveal]")).toBeAttached();

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await settled(page);

    await expect(question(page, "life")).toHaveCSS("opacity", "1");
  });

  test("never hides what the first screen already shows", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/about");
    await expect(page.locator("[data-reveal]")).toBeAttached();
    await settled(page);

    const opacities = await page.locator("main section[id] > div").evaluateAll((items) =>
      items
        .filter((item) => item.getBoundingClientRect().top < window.innerHeight)
        .map((item) => getComputedStyle(item).opacity),
    );

    expect(opacities.length).toBeGreaterThan(0);
    expect(new Set(opacities)).toEqual(new Set(["1"]));
  });

  test("does not flicker the target of a deep link", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as { lowest: number };
      state.lowest = 1;
      const sample = () => {
        const target = document.querySelector("#next > div");
        if (target) state.lowest = Math.min(state.lowest, Number(getComputedStyle(target).opacity));
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await page.goto("/en/about#next");
    await expect(page.locator("[data-reveal]")).toBeAttached();
    await settled(page);

    expect(await page.evaluate(() => (window as unknown as { lowest: number }).lowest)).toBe(1);
  });

  test("prints every section", async ({ page }) => {
    await page.goto("/en/about");
    await expect(page.locator("[data-reveal]")).toBeAttached();

    await page.emulateMedia({ media: "print" });
    await settled(page);

    await expect(question(page, "life")).toHaveCSS("opacity", "1");
  });

  test("shows a section when it scrolls in", async ({ page }) => {
    await page.goto("/en/about");
    await expect(page.locator("[data-reveal]")).toBeAttached();
    await expect(question(page, "life")).toHaveCSS("opacity", "0");

    await page.locator("#life").scrollIntoViewIfNeeded();

    await expect(question(page, "life")).toHaveCSS("opacity", "1");
  });

  test("shows the first section at once", async ({ page }) => {
    await page.goto("/en/about");
    await expect(page.locator("[data-reveal]")).toBeAttached();

    await expect(question(page, "who")).toHaveCSS("opacity", "1");
  });

  test("a deep link shows its section and everything above it", async ({ page }) => {
    await page.goto("/en/about#next");

    for (const slug of ["who", "how", "results", "scale", "next"]) {
      await expect(question(page, slug)).toHaveCSS("opacity", "1");
    }
  });

  test("leaves nothing hidden after a return to the page", async ({ page }) => {
    await page.goto("/en/about");
    await page.locator("#scale").scrollIntoViewIfNeeded();
    await expect(question(page, "scale")).toHaveCSS("opacity", "1");

    await page.locator("header a").first().click();
    await page.waitForURL("**/en");
    await page.goBack();
    await page.waitForURL("**/en/about");

    await expect(page.getByRole("heading", { level: 1, name: "About me" })).toBeVisible();
    for (const slug of ["who", "how", "results", "scale"]) {
      await expect(question(page, slug)).toHaveCSS("opacity", "1");
    }
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("hides nothing", async ({ page }) => {
      await page.goto("/en/about");

      await expect(page.locator("[data-reveal]")).toHaveCount(0);
      await expect(question(page, "life")).toHaveCSS("opacity", "1");
    });
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("hides nothing", async ({ page }) => {
      await page.goto("/en/about");

      await expect(question(page, "life")).toHaveCSS("opacity", "1");
    });
  });
});

test.describe("question chips", () => {
  test("lists the questions in order", async ({ page }) => {
    await page.goto("/en/about");

    await expect(chips(page).getByRole("link")).toHaveText([
      "Who I am",
      "How I work",
      "Results I'm proud of",
      "Teams and scale",
      "What I'm looking for",
      "Outside of work",
    ]);
  });

  test("stay under the header while the page scrolls", async ({ page }) => {
    await page.goto("/en/about");

    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));

    await expect(async () => {
      const header = await page.locator("header").boundingBox();
      const bar = await chips(page).boundingBox();
      expect(Math.abs(bar!.y - (header!.y + header!.height))).toBeLessThanOrEqual(1.5);
    }).toPass({ timeout: 3000 });
  });

  test("scroll to a section below the sticky bars", async ({ page }) => {
    await page.goto("/en/about");

    await chips(page).getByRole("link", { name: "Teams and scale" }).click();

    await page.waitForURL("**/en/about#scale");
    await expectBelowBars(page, "scale");
    await expect(chips(page).getByRole("link", { name: "Teams and scale" })).toHaveAttribute("aria-current", "true");
  });

  test("animate the scroll", async ({ page }) => {
    await page.goto("/en/about");

    const { early, final } = await chips(page)
      .getByRole("link", { name: "Outside of work" })
      .evaluate(async (link) => {
        const frame = () => new Promise(requestAnimationFrame);
        const ended = new Promise((resolve) => window.addEventListener("scrollend", resolve, { once: true }));

        (link as HTMLElement).click();
        await frame();
        await frame();
        const early = window.scrollY;
        await ended;

        return { early, final: window.scrollY };
      });

    expect(early).toBeLessThan(final);
  });

  test("move the keyboard focus to the section", async ({ page }) => {
    await page.goto("/en/about");

    await chips(page).getByRole("link", { name: "Teams and scale" }).focus();
    await page.keyboard.press("Enter");

    await page.waitForURL("**/en/about#scale");
    await expect(page.locator("#scale").filter({ visible: true })).toBeFocused();
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("jump to the section", async ({ page }) => {
      await page.goto("/en/about");

      const { first, final } = await chips(page)
        .getByRole("link", { name: "Outside of work" })
        .evaluate(async (link) => {
          (link as HTMLElement).click();
          const first = window.scrollY;
          await new Promise((resolve) => setTimeout(resolve, 300));

          return { first, final: window.scrollY };
        });

      expect(first).toBeGreaterThan(0);
      expect(first).toBe(final);
    });
  });

  test.describe("on the last section", () => {
    const lastChip = (page: import("@playwright/test").Page) =>
      chips(page).getByRole("link", { name: "Outside of work" });
    const chooseLast = async (page: import("@playwright/test").Page) => {
      await lastChip(page).click();
      await page.waitForURL("**/en/about#life");
      await page.waitForTimeout(800);
    };

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test("keep the chosen chip", async ({ page }) => {
      await page.goto("/en/about");

      await chooseLast(page);

      await expect(lastChip(page)).toHaveAttribute("aria-current", "true");
    });

    test("show the target of a deep link", async ({ page }) => {
      await page.goto("/en/about#life");
      await page.waitForTimeout(500);

      await expect(lastChip(page)).toHaveAttribute("aria-current", "true");
    });

    test("keep the chosen chip through a press that scrolls nothing", async ({ page }) => {
      await page.goto("/en/about");
      await chooseLast(page);

      await page.getByRole("heading", { level: 2, name: "And outside of work?" }).click();
      await page.waitForTimeout(300);

      await expect(lastChip(page)).toHaveAttribute("aria-current", "true");
    });

    test("follow the page again once the visitor scrolls", async ({ page }) => {
      await page.goto("/en/about");
      await chooseLast(page);

      await page.keyboard.press("Home");

      await expect(chips(page).getByRole("link", { name: "Who I am" })).toHaveAttribute("aria-current", "true");
    });
  });

  test("follow the message nearest to the top while the page scrolls", async ({ page }) => {
    await page.goto("/en/about");

    await page.locator("#how").evaluate((section) => section.scrollIntoView({ behavior: "instant" }));

    await expect(chips(page).getByRole("link", { name: "How I work" })).toHaveAttribute("aria-current", "true");
  });

  test("skip a message that has gone under the sticky bars", async ({ page }) => {
    await page.goto("/en/about");

    await page.locator("#how").evaluate((section) => section.scrollIntoView({ behavior: "instant" }));
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollBy({ top: 40, behavior: "instant" }));

    await expect(chips(page).getByRole("link", { name: "Results I'm proud of" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("do not reach the last chip by scrolling alone", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/about");

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

    await expect(chips(page).getByRole("link", { name: "What I'm looking for" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("add no history entries", async ({ page }) => {
    await page.goto("/en/about");
    const before = await page.evaluate(() => history.length);

    for (const name of ["How I work", "Teams and scale", "Outside of work"]) {
      await chips(page).getByRole("link", { name }).click();
    }

    await page.waitForURL("**/en/about#life");
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("leave a history entry the router can return to", async ({ page }) => {
    await page.goto("/en/about");
    await chips(page).getByRole("link", { name: "Teams and scale" }).click();
    await page.waitForURL("**/en/about#scale");

    await page.locator("header a").first().click();
    await page.waitForURL("**/en");
    await page.goBack();

    await page.waitForURL("**/en/about#scale");
    await expect(page.getByRole("heading", { level: 1, name: "About me" })).toBeVisible();
  });

  test("do not trap the back link on the page", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("region", { name: "About" }).getByRole("link", { name: "Read more" }).click();
    await page.waitForURL("**/en/about");

    for (const name of ["How I work", "Teams and scale", "Outside of work"]) {
      await chips(page).getByRole("link", { name }).click();
    }
    await page.waitForURL("**/en/about#life");

    await page.getByRole("link", { name: "Back" }).click();

    await page.waitForURL("**/en");
  });

  test("a deep link lands below the sticky bars", async ({ page }) => {
    await page.goto("/en/about#results");

    await expectBelowBars(page, "results");
  });

  for (const [from, to, language] of [
    ["en", "ru", /Русский/],
    ["ru", "en", /English/],
  ] as const) {
    test(`keep working after a switch from ${from} to ${to}`, async ({ page }) => {
      await page.goto(`/${from}/about`);
      await page.locator("header button").first().click();
      await page.getByRole("menuitemradio", { name: language }).click();
      await page.waitForURL(`**/${to}/about`);
      await expect(page.locator(`html[lang=${to}]`)).toBeAttached();
      await expect(page.locator('[id="scale"]')).toHaveCount(2);

      await chips(page, to).getByRole("link", { name: "Teams and scale" }).click();

      await page.waitForURL(`**/${to}/about#scale`);
      await expectBelowBars(page, "scale", to);
      await expect(chips(page, to).getByRole("link", { name: "Teams and scale" })).toHaveAttribute("aria-current", "true");
    });
  }

  test("scroll inside their row on a 320 px phone, not the page", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/en/about");

    const row = await chips(page).evaluate((nav) => ({ scrollWidth: nav.scrollWidth, clientWidth: nav.clientWidth }));
    expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

    await expect(async () => {
      const bar = await chips(page).boundingBox();
      const chip = await chips(page).locator('[aria-current="true"]').boundingBox();
      expect(chip!.x).toBeGreaterThanOrEqual(bar!.x);
      expect(chip!.x + chip!.width).toBeLessThanOrEqual(bar!.x + bar!.width);
    }).toPass({ timeout: 3000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("are plain links to the sections", async ({ page }) => {
      await page.goto("/en/about");

      await page.getByRole("navigation", { name: "Questions" }).getByRole("link", { name: "Teams and scale" }).click();

      await page.waitForURL("**/en/about#scale");
      await expectBelowBars(page, "scale");
    });
  });
});
