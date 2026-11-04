import type { SkillList } from "@/content/skills";

type Skill = SkillList["skills"][number];

interface SkillFilter {
  query: string;
  domain: string | null;
}

export const filterSkills = (skills: Skill[], filter: SkillFilter): Skill[] => {
  const query = filter.query.trim().toLowerCase();

  return skills.filter(
    (skill) => (filter.domain === null || skill.domain === filter.domain) && skill.name.toLowerCase().includes(query),
  );
};
