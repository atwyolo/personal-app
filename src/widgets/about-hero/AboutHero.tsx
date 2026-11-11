import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { PageHero } from "@/shared/ui/PageHero";

export const AboutHero: FC = async () => {
  const [t, common] = await Promise.all([getTranslations("Pages.About"), getTranslations("Pages.Common")]);

  return <PageHero backLabel={common("back")} title={t("title")} intro={t("intro")} />;
};
