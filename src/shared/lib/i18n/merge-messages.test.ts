import { describe, expect, it } from "vitest";
import { mergeMessages } from "./merge-messages";

describe("mergeMessages", () => {
  const en = {
    nav: { home: "Home", blog: "Blog" },
    hero: { title: "Hello" },
  };

  it("uses the fallback when the locale has no messages", () => {
    expect(mergeMessages(en, {})).toEqual(en);
  });

  it("prefers translated strings and keeps untranslated ones from the fallback", () => {
    const ru = { nav: { home: "Главная" } };

    expect(mergeMessages(en, ru)).toEqual({
      nav: { home: "Главная", blog: "Blog" },
      hero: { title: "Hello" },
    });
  });

  it("treats an empty string as untranslated", () => {
    expect(mergeMessages(en, { hero: { title: "" } }).hero).toEqual({ title: "Hello" });
  });

  describe("non-string leaves (metadata in Meta.*)", () => {
    const meta = { site: { hidden: true, iconUrl: "https://a.dev/icon.svg", logoUrl: null, size: 32 } };

    it("treats null in the locale as untranslated", () => {
      expect(mergeMessages(meta, { site: { iconUrl: null } }).site.iconUrl).toBe("https://a.dev/icon.svg");
    });

    it("lets false override true", () => {
      expect(mergeMessages(meta, { site: { hidden: false } }).site.hidden).toBe(false);
    });

    it("lets a number override", () => {
      expect(mergeMessages(meta, { site: { size: 48 } }).site.size).toBe(48);
    });

    it("lets a string replace a null fallback", () => {
      expect(mergeMessages(meta, { site: { logoUrl: "https://a.dev/logo.svg" } }).site.logoUrl).toBe(
        "https://a.dev/logo.svg",
      );
    });
  });

  it("does not mutate its arguments", () => {
    const ru = { nav: { home: "Главная" } };
    mergeMessages(en, ru);

    expect(en.nav.home).toBe("Home");
    expect(ru).toEqual({ nav: { home: "Главная" } });
  });
});
