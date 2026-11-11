import { describe, expect, it } from "vitest";

import { metaMd } from "./fixtures";
import { readMeta } from "./meta";
import { writeContentTree } from "./test-tree";

describe("metadata from meta.md", () => {
  it("reads the site settings and every page", () => {
    const meta = readMeta(writeContentTree({ "en/meta.md": metaMd }), "en");

    expect(meta.Common).toEqual({
      siteName: "Mike",
      defaultTitle: "Mike",
      iconIcoUrl: null,
      iconSvgUrl: "https://a.dev/icon.svg",
      iconPngUrl: null,
      appleTouchIconUrl: null,
      ogPlaceholderUrl: null,
      hiddenFromSearch: true,
    });
    expect(meta.About).toEqual({ title: "About — Mike", description: "Interview.", ogImageUrl: null });
    expect(Object.keys(meta)).toEqual(["Common", "Home", "About", "Skills", "Experience", "NotFound"]);
  });

  it("translates one field of a page and inherits the rest", () => {
    const root = writeContentTree({ "en/meta.md": metaMd, "ru/meta.md": "---\nAbout:\n  title: Обо мне — Майк\n---\n" });

    expect(readMeta(root, "ru").About).toEqual({ title: "Обо мне — Майк", description: "Interview.", ogImageUrl: null });
  });

  it("gives a locale without its own file the English metadata", () => {
    const root = writeContentTree({ "en/meta.md": metaMd });

    expect(readMeta(root, "ja")).toEqual(readMeta(root, "en"));
  });

  it("fails on a page missing in English, naming the file and the node", () => {
    const root = writeContentTree({ "en/meta.md": metaMd.replace(/^Skills:\n(  .*\n)+/m, "") });

    expect(() => readMeta(root, "en")).toThrow(/en\/meta\.md: Skills:/);
  });

  it("rejects a relative icon URL", () => {
    const root = writeContentTree({ "en/meta.md": metaMd.replace("https://a.dev/icon.svg", "/icon.svg") });

    expect(() => readMeta(root, "en")).toThrow(/en\/meta\.md: Common\.iconSvgUrl:/);
  });

  it("rejects hiddenFromSearch written as yes", () => {
    const root = writeContentTree({ "en/meta.md": metaMd.replace("hiddenFromSearch: true", "hiddenFromSearch: yes") });

    expect(() => readMeta(root, "en")).toThrow(/Common\.hiddenFromSearch/);
  });

  it("rejects a node English does not have, naming the translation", () => {
    const root = writeContentTree({ "en/meta.md": metaMd, "ru/meta.md": "---\nBlog:\n  title: Блог\n---\n" });

    expect(() => readMeta(root, "ru")).toThrow(/ru\/meta\.md/);
  });

  it("reads the NotFound title, falling back to English", () => {
    const root = writeContentTree({ "en/meta.md": metaMd, "ru/meta.md": "---\nNotFound:\n  title: Не найдено — Майк\n---\n" });

    expect(readMeta(root, "ru").NotFound).toEqual({ title: "Не найдено — Майк" });
    expect(readMeta(root, "de").NotFound).toEqual({ title: "Not found — Mike" });
  });

  it("rejects a NotFound with a description, since the 404 has only a title", () => {
    const root = writeContentTree({ "en/meta.md": metaMd.replace("  title: Not found — Mike", "  title: Not found — Mike\n  description: Gone.") });

    expect(() => readMeta(root, "en")).toThrow(/NotFound/);
  });
});
