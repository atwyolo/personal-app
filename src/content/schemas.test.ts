import { describe, expect, it } from "vitest";

import { aboutPairSchema, experienceSchema, profileSchema } from "./schemas";

const profile = {
  name: "Mike",
  headline: "Engineer, 8+ years",
  jobTitle: "Engineer",
  whatsappPhone: "+37493310039",
  email: "mike@example.com",
  linkedinUrl: "https://www.linkedin.com/in/mike",
};

const job = {
  company: "Glovo",
  startDate: "2023-01-01",
  sort: 1,
  skills: ["React"],
  descriptionShort: "Built things.",
};

describe("content schemas", () => {
  it("accepts a complete profile and leaves the optional URLs out", () => {
    expect(profileSchema.parse(profile)).toEqual(profile);
  });

  it("rejects a phone number that is not E.164", () => {
    expect(profileSchema.safeParse({ ...profile, whatsappPhone: "8 (999) 123-45-67" }).success).toBe(false);
  });

  it("rejects a URL that is not https", () => {
    expect(profileSchema.safeParse({ ...profile, photoUrl: "http://a.dev/p.jpg" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...profile, photoUrl: "/p.jpg" }).success).toBe(false);
  });

  it("rejects an unknown field, so a misspelt optional field is not silently ignored", () => {
    expect(experienceSchema.safeParse({ ...job, endDat: "2024-01-01" }).success).toBe(false);
  });

  it("converts an unquoted YAML date back to YYYY-MM-DD", () => {
    expect(experienceSchema.parse({ ...job, startDate: new Date("2023-01-01") }).startDate).toBe("2023-01-01");
  });

  it("rejects an About pair without its question", () => {
    expect(aboutPairSchema.safeParse({ sort: 1, linkText: "Who", questionTitle: "Who", answerTitle: "Me" }).success).toBe(
      false,
    );
  });
});
