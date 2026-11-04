// @vitest-environment node
import { describe, expect, it } from "vitest";

import { listSlugs, readContentFile } from "./read";
import { writeContentTree } from "./test-tree";

describe("readContentFile", () => {
  it("splits the frontmatter from the body", () => {
    const root = writeContentTree({ "en/profile.md": "---\nname: Mike\n---\n\nHello **world**.\n" });

    const file = readContentFile(root, "en", "profile.md");

    expect(file?.data).toEqual({ name: "Mike" });
    expect(file?.body.trim()).toBe("Hello **world**.");
    expect(file?.file.endsWith("en/profile.md")).toBe(true);
  });

  it("returns null for a missing file", () => {
    const root = writeContentTree({ "en/profile.md": "---\nname: Mike\n---\n" });

    expect(readContentFile(root, "ru", "profile.md")).toBeNull();
  });
});

describe("listSlugs", () => {
  it("lists the English files of a folder by name, sorted", () => {
    const root = writeContentTree({ "en/about/who.md": "", "en/about/aim.md": "", "en/about/notes.txt": "" });

    expect(listSlugs(root, "about")).toEqual(["aim", "who"]);
  });

  it("rejects a locale file with no English counterpart", () => {
    const root = writeContentTree({ "en/about/who.md": "", "ru/about/wh0.md": "" });

    expect(() => listSlugs(root, "about")).toThrow(/ru\/about\/wh0\.md.*no English counterpart/);
  });
});
