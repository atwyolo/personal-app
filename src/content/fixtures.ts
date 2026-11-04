export const skillsMd = [
  "---",
  "domains:",
  "  - {key: core, label: Core}",
  "  - {key: tools, label: Tools}",
  "  - {key: empty, label: Empty}",
  "skills:",
  "  - {name: React, level: 9, domain: core, main: true, top: true, sort: 1}",
  "  - {name: TypeScript, level: 9, domain: core, main: true, top: true, sort: 0}",
  "  - {name: Vite, level: 7, domain: tools, top: true, sort: 5}",
  "  - {name: Git, level: 7, domain: tools, sort: 5}",
  "---",
  "",
].join("\n");

export const profileMd = [
  "---",
  "name: Mike",
  "headline: Engineer, 8+ years",
  "jobTitle: Engineer",
  "photoUrl: https://a.dev/photo.jpg",
  'whatsappPhone: "+37493310039"',
  "email: mike@example.com",
  "linkedinUrl: https://www.linkedin.com/in/mike",
  "---",
  "",
  "Lead.",
  "",
].join("\n");

export const jobMd = (fields: Record<string, string>, body = "") =>
  [
    "---",
    ...Object.entries({ company: "Acme", startDate: '"2021-03-01"', sort: "0", skills: "[React]", descriptionShort: "Did things.", ...fields }).map(
      ([key, value]) => `${key}: ${value}`,
    ),
    "---",
    "",
    body,
  ].join("\n");
