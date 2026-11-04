// @vitest-environment node
import { describe, expect, it } from "vitest";

import { profileMd, skillsMd } from "./fixtures";
import { readProfile } from "./profile";
import { writeContentTree } from "./test-tree";

describe("readProfile", () => {
  it("returns the profile with derived contacts, the hero skills and the Markdown body", () => {
    const root = writeContentTree({ "en/profile.md": profileMd, "en/skills.md": skillsMd });

    expect(readProfile(root, "en")).toEqual({
      name: "Mike",
      headline: "Engineer, 8+ years",
      jobTitle: "Engineer",
      photoUrl: "https://a.dev/photo.jpg",
      cvUrl: null,
      aboutShort: "Lead.",
      heroSkills: ["TypeScript", "React"],
      contacts: {
        whatsapp: { href: "https://wa.me/37493310039", display: "+374 93 310039" },
        email: { href: "mailto:mike@example.com", display: "mike@example.com", mailbox: "mike" },
        linkedin: { href: "https://www.linkedin.com/in/mike", display: "linkedin.com/in/mike" },
      },
    });
  });

  it("takes a locale's own CV and keeps the rest from English", () => {
    const root = writeContentTree({
      "en/profile.md": profileMd,
      "en/skills.md": skillsMd,
      "de/profile.md": "---\ncvUrl: https://a.dev/cv-de.pdf?download=1\n---\n",
    });

    expect(readProfile(root, "de")).toMatchObject({ name: "Mike", cvUrl: "https://a.dev/cv-de.pdf?download=1" });
  });
});
