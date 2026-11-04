import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getSkills } from "@/content/skills";

import { SkillsExplorer } from "./ui/SkillsExplorer";

export const Skills: FC = async () => {
  const { skills, domains } = await getSkills(await getLocale());

  return <SkillsExplorer skills={skills} domains={domains} />;
};
