import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { PageHero } from "@/shared/ui/PageHero";
import { Skills } from "@/widgets/skills/Skills";

/** The full skills list: the hero (owner's correction: no label above the title), then the explorer. */
export const SkillsPage: FC = async () => {
  const [t, common] = await Promise.all([getTranslations("SkillsPage"), getTranslations("Common")]);

  return (
    <main className="w-full">
      <PageHero backLabel={common("back")} title={t("title")} intro={t("intro")} />
      <Skills />
    </main>
  );
};
