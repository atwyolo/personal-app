import { describe, expect, it, vi } from "vitest";
import { TopSkills } from "./TopSkills";

// The rest of the block reads the content files and lives in e2e/home-skills.spec.ts. Its data cannot be emptied there.
vi.mock("@/content/skills", () => ({ getTopSkills: async () => ({ skills: [], total: 42 }) }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
// next-intl navigation needs the Next router.
vi.mock("@/shared/lib/i18n/navigation", () => ({ Link: () => null }));

describe("TopSkills", () => {
  it("renders nothing when no skill is marked", async () => {
    expect(await TopSkills({})).toBeNull();
  });
});
