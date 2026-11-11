import { describe, expect, it } from "vitest";
import { getLocaleAlternates } from "./alternates";

describe("getLocaleAlternates", () => {
  it("builds canonical and hreflang links for the home page", () => {
    expect(getLocaleAlternates("ru")).toEqual({
      canonical: "/ru",
      languages: {
        en: "/en",
        ru: "/ru",
        pt: "/pt",
        es: "/es",
        de: "/de",
        fr: "/fr",
        ja: "/ja",
        pl: "/pl",
        "x-default": "/",
      },
    });
  });

  it("keeps the path after the locale for nested pages", () => {
    const alternates = getLocaleAlternates("de", "/blog/hello");

    expect(alternates.canonical).toBe("/de/blog/hello");
    expect(alternates.languages.ja).toBe("/ja/blog/hello");
    expect(alternates.languages["x-default"]).toBe("/blog/hello");
  });
});
