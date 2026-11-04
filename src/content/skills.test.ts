import { describe, expect, it } from "vitest";

import { skillsMd } from "./fixtures";
import { readSkillList, readTopSkills } from "./skills";
import { writeContentTree } from "./test-tree";

describe("skills", () => {
  it("orders skills by level desc, then sort, then name, and hides empty domains", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd });

    const list = readSkillList(root, "en");

    expect(list.skills.map((s) => s.name)).toEqual(["TypeScript", "React", "Git", "Vite"]);
    expect(list.skills[0]).toEqual({ name: "TypeScript", level: 9, domain: "core" });
    expect(list.domains).toEqual([
      { key: "core", label: "Core", count: 2 },
      { key: "tools", label: "Tools", count: 2 },
    ]);
  });

  it("breaks ties by name in code-point order, as the database did (uppercase before lowercase)", () => {
    const tie = (name: string) => `  - {name: ${name}, level: 6, domain: core, sort: 100}`;
    const md = skillsMd.replace("skills:\n", `skills:\n${["styled-components", "Redux", "RTK Query", "Zod"].map(tie).join("\n")}\n`);
    const root = writeContentTree({ "en/skills.md": md });

    const names = readSkillList(root, "en").skills.filter((s) => s.level === 6).map((s) => s.name);

    expect(names).toEqual(["RTK Query", "Redux", "Zod", "styled-components"]);
  });

  it("translates a domain label per locale", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd, "ru/skills.md": "---\ndomains:\n  - {key: tools, label: Инструменты}\n---\n" });

    expect(readSkillList(root, "ru").domains.map((d) => d.label)).toEqual(["Core", "Инструменты"]);
  });

  it("lists the top skills and counts every skill", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd });

    expect(readTopSkills(root)).toEqual({
      skills: [
        { name: "TypeScript", level: 9 },
        { name: "React", level: 9 },
        { name: "Vite", level: 7 },
      ],
      total: 4,
    });
  });

  it("rejects a skill in a domain that does not exist", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd.replace("domain: tools, sort: 5}", "domain: tool, sort: 5}") });

    expect(() => readSkillList(root, "en")).toThrow(/skills\.md.*Git.*"tool"/);
  });

  it("rejects a skill listed twice", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd.replace("name: Git", "name: Vite") });

    expect(() => readSkillList(root, "en")).toThrow(/skills\.md.*Vite.*twice/);
  });
});
