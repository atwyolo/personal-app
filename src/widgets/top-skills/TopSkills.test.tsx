import { describe, expect, it, vi } from "vitest";
import { TopSkills } from "./TopSkills";

vi.mock("@/content/skills", () => ({ getTopSkills: async () => ({ skills: [], total: 42 }) }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("@/shared/lib/i18n/navigation", () => ({ Link: () => null }));

describe("TopSkills", () => {
  it("renders nothing when no skill is marked", async () => {
    expect(await TopSkills({})).toBeNull();
  });
});
