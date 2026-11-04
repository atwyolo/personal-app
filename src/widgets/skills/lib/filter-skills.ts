import type { SkillList } from "@/content/skills";

type Skill = SkillList["skills"][number];

interface SkillFilter {
  /** Matched as a case-insensitive substring of the name, after trimming. */
  query: string;
  /** A domain key; `null` means every domain. */
  domain: string | null;
}

/** The skills that match both the query and the domain, in their original order: filtering never reorders. */
export const filterSkills = (skills: Skill[], filter: SkillFilter): Skill[] => {
  const query = filter.query.trim().toLowerCase();

  return skills.filter(
    (skill) => (filter.domain === null || skill.domain === filter.domain) && skill.name.toLowerCase().includes(query),
  );
};
