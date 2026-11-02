import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { BackLink } from "@/shared/ui/BackLink";

export const AboutHero: FC = async () => {
  const [t, common] = await Promise.all([getTranslations("About"), getTranslations("Common")]);

  return (
    <div className="px-[18px] pt-6 pb-3 lg:px-16 lg:pt-12 lg:pb-6">
      <BackLink label={common("back")} />
      <div className="flex flex-col gap-2.5">
        <h1 className="text-4xl leading-none font-bold tracking-[-0.04em] lg:text-[56px]">{t("title")}</h1>
        <p className="max-w-[640px] text-[15px] leading-[1.6] text-foreground-soft lg:text-base lg:leading-[1.7]">
          {t("intro")}
        </p>
      </div>
    </div>
  );
};
