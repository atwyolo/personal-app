import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getTopSkills } from "@/db/queries/home";
import { SkillRow } from "@/features/skill-row/SkillRow";
import { ButtonLink } from "@/shared/ui/ButtonLink";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Tile } from "@/shared/ui/Tile";

/** My top skills: the skills marked `top`, then the way to the full list. No marked skill, no block. */
export const TopSkills: FC = async () => {
  const [{ skills, total }, t] = await Promise.all([getTopSkills(), getTranslations("Pages.Home.skills")]);

  if (skills.length === 0) return null;

  return (
    <section aria-labelledby="skills-title" className="flex flex-col gap-3 lg:gap-4">
      <SectionHeader id="skills-title">{t("label")}</SectionHeader>
      <Tile className="reveal reveal-left p-5 lg:px-8 lg:py-7">
        <ul className="grid gap-3.5 lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:gap-x-12 lg:gap-y-4.5">
          {skills.map((skill) => (
            <li key={skill.name}>
              <SkillRow skill={skill} />
            </li>
          ))}
        </ul>
      </Tile>
      <ButtonLink href="/skills" tone="primary" className="lg:self-end">
        {t("showAll", { total })}
      </ButtonLink>
    </section>
  );
};
