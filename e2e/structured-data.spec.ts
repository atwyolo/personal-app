import { expect, test } from "./fixtures";

import { readSiteMeta } from "./meta-content";

const jsonLdOf = async (page: import("@playwright/test").Page) => {
  const script = page.locator('script[type="application/ld+json"]');
  await expect(script).toHaveCount(1);

  return JSON.parse((await script.textContent())!);
};

test("Home describes the site and the person in one graph", async ({ page }) => {
  const site = await readSiteMeta();
  await page.goto("/en");

  expect(await jsonLdOf(page)).toEqual({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: site.siteName, url: "http://localhost:3100/", inLanguage: "en" },
      {
        "@type": "Person",
        "@id": "http://localhost:3100/#person",
        name: "Mikhail Aleksandrov",
        jobTitle: "Senior Frontend Software Engineer",
        url: "http://localhost:3100/",
        image: "https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/e2e/photo.jpg",
        sameAs: ["https://www.linkedin.com/in/mikhail-aleksandrov-job"],
      },
    ],
  });
});

test("About points at the same person as Home", async ({ page }) => {
  await page.goto("/en/about");

  expect((await jsonLdOf(page)).mainEntity["@id"]).toBe("http://localhost:3100/#person");
});

test("a locale whose name falls back to English has no alternateName", async ({ page }) => {
  await page.goto("/ru");

  const person = (await jsonLdOf(page))["@graph"][1];
  expect(person.name).toBe("Mikhail Aleksandrov");
  expect(person).not.toHaveProperty("alternateName");
});

for (const path of ["/en", "/en/about"]) {
  test(`${path} carries no email and no telephone in its structured data`, async ({ page }) => {
    await page.goto(path);

    const text = await page.locator('script[type="application/ld+json"]').textContent();
    expect(text).not.toMatch(/email|telephone|@gmail|\+\d{6,}/);
  });
}
