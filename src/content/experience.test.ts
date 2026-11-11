import { describe, expect, it } from "vitest";

import { readExperience } from "./experience";
import { jobMd, skillsMd } from "./fixtures";
import { writeContentTree } from "./test-tree";

describe("readExperience", () => {
  it("returns the jobs by sort with their skills, dates and Markdown description", () => {
    const root = writeContentTree({
      "en/skills.md": skillsMd,
      "en/experience/acme.md": jobMd({ sort: "1", endDate: '"2023-05-01"', role: "Engineer", skills: "[Vite, React]" }, "- Shipped."),
      "en/experience/zeta.md": jobMd({ company: "Zeta", sort: "0", imageUrl: "https://a.dev/z.png" }),
    });

    expect(readExperience(root, "en", "2026-11-04")).toEqual([
      {
        slug: "zeta",
        company: "Zeta",
        role: null,
        startDate: "2021-03-01",
        endDate: null,
        today: "2026-11-04",
        imageUrl: "https://a.dev/z.png",
        descriptionShort: "Did things.",
        descriptionFull: null,
        skills: ["React"],
      },
      {
        slug: "acme",
        company: "Acme",
        role: "Engineer",
        startDate: "2021-03-01",
        endDate: "2023-05-01",
        today: "2026-11-04",
        imageUrl: null,
        descriptionShort: "Did things.",
        descriptionFull: "- Shipped.",
        skills: ["Vite", "React"],
      },
    ]);
  });

  it("rejects a job naming a skill that skills.md does not have, naming both", () => {
    const root = writeContentTree({ "en/skills.md": skillsMd, "en/experience/acme.md": jobMd({ skills: "[React, Vue]" }) });

    expect(() => readExperience(root, "en", "2026-11-04")).toThrow(/experience\/acme\.md.*"Vue".*skills\.md/);
  });
});
