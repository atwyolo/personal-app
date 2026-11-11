import { describe, expect, it } from "vitest";
import { z } from "zod";

import { loadLocalized } from "./localize";
import { skillsSchema } from "./schemas";
import { writeContentTree } from "./test-tree";

const schema = z.strictObject({ name: z.string(), headline: z.string(), since: z.iso.date() });
const en = "---\nname: Mike\nheadline: Engineer\nsince: \"2021-03-01\"\n---\n\nEnglish body.\n";

describe("loadLocalized", () => {
  it("gives a locale without its own file the English content", () => {
    const root = writeContentTree({ "en/profile.md": en });

    expect(loadLocalized({ root, locale: "ru", path: "profile.md", schema })).toEqual({
      name: "Mike",
      headline: "Engineer",
      since: "2021-03-01",
      body: "English body.",
      slug: "profile",
    });
  });

  it("keeps every English field and the English body that a partial locale file leaves out", () => {
    const root = writeContentTree({ "en/profile.md": en, "ru/profile.md": "---\nname: Михаил\n---\n" });

    expect(loadLocalized({ root, locale: "ru", path: "profile.md", schema })).toMatchObject({
      name: "Михаил",
      headline: "Engineer",
      body: "English body.",
    });
  });

  it("takes the locale's body when it has one", () => {
    const root = writeContentTree({ "en/profile.md": en, "ru/profile.md": "---\n---\n\nРусский текст.\n" });

    expect(loadLocalized({ root, locale: "ru", path: "profile.md", schema }).body).toBe("Русский текст.");
  });

  it("fails when the English file is missing, even if the locale has one", () => {
    const root = writeContentTree({ "ru/profile.md": en });

    expect(() => loadLocalized({ root, locale: "ru", path: "profile.md", schema })).toThrow(
      /Content file missing: .*en\/profile\.md/,
    );
  });

  it("translates only the domain label a locale's skills file names, whatever the order", () => {
    const root = writeContentTree({
      "en/skills.md":
        "---\ndomains:\n  - { key: core, label: Core }\n  - { key: tools, label: Tools }\nskills:\n  - { name: React, level: 9, domain: core }\n---\n",
      "ru/skills.md": "---\ndomains:\n  - { key: tools, label: Инструменты }\n---\n",
    });

    const skills = loadLocalized({ root, locale: "ru", path: "skills.md", schema: skillsSchema, lists: { domains: "key", skills: "name" } });

    expect(skills.domains).toEqual([{ key: "core", label: "Core" }, { key: "tools", label: "Инструменты" }]);
    expect(skills.skills).toEqual([{ name: "React", level: 9, domain: "core", main: false, top: false, sort: 0 }]);
  });

  it("blames the English file for a bad English field, even when a translation exists", () => {
    const root = writeContentTree({
      "en/profile.md": en.replace('since: "2021-03-01"', 'since: "March 2021"'),
      "ru/profile.md": "---\nname: Михаил\n---\n",
    });

    expect(() => loadLocalized({ root, locale: "ru", path: "profile.md", schema })).toThrow(
      /Invalid content in .*en\/profile\.md: since/,
    );
  });

  it("blames the translation for a bad translated field", () => {
    const root = writeContentTree({ "en/profile.md": en, "ru/profile.md": "---\nsince: soon\n---\n" });

    expect(() => loadLocalized({ root, locale: "ru", path: "profile.md", schema })).toThrow(
      /Invalid content in .*ru\/profile\.md: since/,
    );
  });

  it("names the file and the field of invalid content", () => {
    const skills = [7, 8, 9, 11].map((level, i) => `  - { name: S${i}, level: ${level}, domain: core }`).join("\n");
    const root = writeContentTree({ "en/skills.md": `---\ndomains:\n  - { key: core, label: Core }\nskills:\n${skills}\n---\n` });

    expect(() => loadLocalized({ root, locale: "en", path: "skills.md", schema: skillsSchema })).toThrow(
      /Invalid content in .*en\/skills\.md: skills\.3\.level/,
    );
  });

  it("reads an unquoted date as the string written", () => {
    const root = writeContentTree({ "en/job.md": "---\nstart: 2021-03-01\n---\n" });

    expect(loadLocalized({ root, locale: "en", path: "job.md", schema: z.strictObject({ start: z.iso.date() }) }).start).toBe("2021-03-01");
  });

  it("rejects a body with Markdown the site does not render, naming the file", () => {
    const root = writeContentTree({ "en/profile.md": "---\nname: Mike\nheadline: E\nsince: \"2021-03-01\"\n---\n\n> quote\n" });

    expect(() => loadLocalized({ root, locale: "en", path: "profile.md", schema })).toThrow(
      /Unsupported Markdown "blockquote" in .*en\/profile\.md/,
    );
  });
});
