import { describe, expect, it } from "vitest";

import { listSlugs, readContentFile, resolveContentRoot } from "./read";
import { writeContentTree } from "./test-tree";

describe("readContentFile", () => {
  it("splits the frontmatter from the body", () => {
    const root = writeContentTree({ "en/profile.md": "---\nname: Mike\n---\n\nHello **world**.\n" });

    const file = readContentFile(root, "en", "profile.md");

    expect(file?.data).toEqual({ name: "Mike" });
    expect(file?.body.trim()).toBe("Hello **world**.");
    expect(file?.file.endsWith("en/profile.md")).toBe(true);
  });

  it("names the file of a YAML syntax error", () => {
    const root = writeContentTree({ "en/experience/acme.md": '---\ncompany: "Acme\n---\n' });

    expect(() => readContentFile(root, "en", "experience/acme.md")).toThrow(/Invalid frontmatter in .*en\/experience\/acme\.md/);
  });

  it("reads YAML 1.2: unquoted dates and NO stay strings", () => {
    const root = writeContentTree({ "en/job.md": "---\nstart: 2021-03-01\ncountry: NO\nlevel: 9\nmain: true\n---\n" });

    expect(readContentFile(root, "en", "job.md")?.data).toEqual({ start: "2021-03-01", country: "NO", level: 9, main: true });
  });

  it("reads Windows line endings", () => {
    const root = writeContentTree({ "en/profile.md": "---\r\nname: Mike\r\n---\r\n\r\nHello.\r\n" });

    const file = readContentFile(root, "en", "profile.md");

    expect(file?.data).toEqual({ name: "Mike" });
    expect(file?.body.trim()).toBe("Hello.");
  });

  it("treats a file without frontmatter as a body with no fields", () => {
    const root = writeContentTree({ "en/note.md": "Just text.\n" });

    expect(readContentFile(root, "en", "note.md")).toMatchObject({ data: {}, body: "Just text.\n" });
  });

  it("only takes frontmatter from the very start of the file", () => {
    const source = "Intro.\n\n---\nname: Mike\n---\n";
    const root = writeContentTree({ "en/note.md": source });

    expect(readContentFile(root, "en", "note.md")).toMatchObject({ data: {}, body: source });
  });

  it("reads an empty frontmatter as no fields", () => {
    const root = writeContentTree({ "en/note.md": "---\n---\nText.\n" });

    expect(readContentFile(root, "en", "note.md")).toMatchObject({ data: {}, body: "Text.\n" });
  });

  it("never runs a JavaScript frontmatter fence", () => {
    const root = writeContentTree({ "en/note.md": "---js\n{ hacked: (globalThis.hacked = true) }\n---\n" });

    expect(readContentFile(root, "en", "note.md")?.data).toEqual({});
    expect((globalThis as { hacked?: boolean }).hacked).toBeUndefined();
  });

  it("rejects a frontmatter that is not a mapping, naming the file", () => {
    const root = writeContentTree({ "en/note.md": "---\n- a\n- b\n---\n" });

    expect(() => readContentFile(root, "en", "note.md")).toThrow(/Invalid frontmatter in .*en\/note\.md: .*mapping/);
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

describe("resolveContentRoot", () => {
  it("is the messages folder when nothing is configured", () => {
    expect(resolveContentRoot(undefined, "/repo")).toBe("/repo/messages");
  });

  it("treats an empty value as not configured", () => {
    expect(resolveContentRoot("", "/repo")).toBe("/repo/messages");
  });

  it("resolves a configured folder against the working directory", () => {
    expect(resolveContentRoot("e2e/content", "/repo")).toBe("/repo/e2e/content");
  });
});
