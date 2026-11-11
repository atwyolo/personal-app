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

  it("treats null in the locale as untranslated", () => {
    expect(mergeMessages(en, { hero: { title: null } }).hero).toEqual({ title: "Hello" });
  });

  it("does not mutate its arguments", () => {
    const ru = { nav: { home: "Главная" } };
    mergeMessages(en, ru);

    expect(en.nav.home).toBe("Home");
    expect(ru).toEqual({ nav: { home: "Главная" } });
  });
});
