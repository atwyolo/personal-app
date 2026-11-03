import { describe, expect, it } from "vitest";

import { filterSkills } from "./filter-skills";

// In the page's order: level desc, then sort, then name.
const skills = [
  { name: "React", level: 9, domain: "frameworks" },
  { name: "Docker", level: 6, domain: "tools" },
  { name: "Docker Compose", level: 6, domain: "tools" },
  { name: "CSS3", level: 6, domain: "core" },
  { name: "Git", level: 6, domain: "tools" },
];

const names = (list: typeof skills) => list.map((s) => s.name);

describe("filterSkills", () => {
  it("finds every skill whose name contains the query", () => {
    expect(names(filterSkills(skills, { query: "dock", domain: null }))).toEqual(["Docker", "Docker Compose"]);
  });

  it("ignores case and the spaces around the query", () => {
    expect(names(filterSkills(skills, { query: "  DOCK ", domain: null }))).toEqual(["Docker", "Docker Compose"]);
  });

  it.each(["", "   "])("keeps every skill for the empty query %j", (query) => {
    expect(filterSkills(skills, { query, domain: null })).toEqual(skills);
  });

  it("keeps only the chosen domain", () => {
    expect(names(filterSkills(skills, { query: "", domain: "tools" }))).toEqual(["Docker", "Docker Compose", "Git"]);
  });

  it("combines the query and the domain", () => {
    expect(names(filterSkills(skills, { query: "o", domain: "tools" }))).toEqual(["Docker", "Docker Compose"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterSkills(skills, { query: "xyz", domain: null })).toEqual([]);
  });

  it("never reorders the skills", () => {
    expect(names(filterSkills(skills, { query: "s", domain: null }))).toEqual(["Docker Compose", "CSS3"]);
  });
});
