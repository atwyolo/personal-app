import { describe, expect, it } from "vitest";

import { mergeFields } from "./merge-fields";

describe("mergeFields", () => {
  it("lets a locale override a field and falls back on null, undefined and empty strings", () => {
    expect(mergeFields({ a: "A", b: "B", c: "C", d: "D" }, { a: "А", b: null, c: "", d: undefined })).toEqual({
      a: "А",
      b: "B",
      c: "C",
      d: "D",
    });
  });

  it("merges a list by the key of its items, never by index", () => {
    const merged = mergeFields(
      { domains: [{ key: "core", label: "Core" }, { key: "tools", label: "Tools" }] },
      { domains: [{ key: "tools", label: "Инструменты" }] },
      { domains: "key" },
    );

    expect(merged.domains).toEqual([{ key: "core", label: "Core" }, { key: "tools", label: "Инструменты" }]);
  });

  it("rejects a list item the English list does not have", () => {
    expect(() =>
      mergeFields({ domains: [{ key: "core", label: "Core" }] }, { domains: [{ key: "cor", label: "Основа" }] }, {
        domains: "key",
      }),
    ).toThrow(/domains.*"cor"/);
  });

  it("merges nested objects field by field", () => {
    const merged = mergeFields(
      { Home: { title: "Home", description: "About me", ogImageUrl: null } },
      { Home: { title: "Главная" } },
    );

    expect(merged).toEqual({ Home: { title: "Главная", description: "About me", ogImageUrl: null } });
  });

  it("keeps the English value for a nested null, undefined or empty string", () => {
    const merged = mergeFields({ Common: { a: "A", b: "B", c: "C" } }, { Common: { a: null, b: "", c: undefined } });

    expect(merged).toEqual({ Common: { a: "A", b: "B", c: "C" } });
  });

  it("keeps the whole English node when the locale writes it empty", () => {
    expect(mergeFields({ Home: { title: "Home" } }, { Home: null })).toEqual({ Home: { title: "Home" } });
  });

  it("lets false override true inside a node", () => {
    expect(mergeFields({ Common: { hiddenFromSearch: true } }, { Common: { hiddenFromSearch: false } })).toEqual({
      Common: { hiddenFromSearch: false },
    });
  });

  it("replaces an English scalar with a locale object and the reverse, leaving the check to the schema", () => {
    expect(mergeFields({ a: "A" }, { a: { b: "B" } })).toEqual({ a: { b: "B" } });
    expect(mergeFields({ a: { b: "B" } }, { a: "A" })).toEqual({ a: "A" });
  });

  it("does not mutate its arguments", () => {
    const en = { Home: { title: "Home" } };
    const ru = { Home: { title: "Главная" } };

    mergeFields(en, ru);

    expect(en).toEqual({ Home: { title: "Home" } });
    expect(ru).toEqual({ Home: { title: "Главная" } });
  });
});
