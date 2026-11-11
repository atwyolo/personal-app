import { describe, expect, it } from "vitest";

import { locales } from "@/shared/lib/locales";

import { buildSitemap } from "./sitemap";

const base = new URL("https://example.com");

describe("buildSitemap", () => {
  it("lists every page of every locale", () => {
    const urls = buildSitemap(base).map((entry) => entry.url);

    expect(urls).toHaveLength(32);
    expect(urls).toContain("https://example.com/ru/about");
    expect(urls).toContain("https://example.com/en");
    expect(urls).toContain("https://example.com/pl/skills");
  });

  it("gives every entry its alternates", () => {
    const about = buildSitemap(base).find((entry) => entry.url === "https://example.com/de/about");

    expect(about?.alternates?.languages).toEqual({
      ...Object.fromEntries(locales.map((locale) => [locale, `https://example.com/${locale}/about`])),
      "x-default": "https://example.com/about",
    });
  });

  it("points x-default of the home page at the site root", () => {
    const home = buildSitemap(base).find((entry) => entry.url === "https://example.com/en");

    expect(home?.alternates?.languages?.["x-default"]).toBe("https://example.com/");
  });

  it("has no 404 and no lastModified", () => {
    const entries = buildSitemap(base);

    expect(entries.some((entry) => entry.url.includes("not-found") || entry.url.includes("404"))).toBe(false);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});
