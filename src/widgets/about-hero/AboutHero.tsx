import { getTranslations } from "next-intl/server";
import type { FC } from "react";

export const AboutHero: FC = async () => {
  const t = await getTranslations("About");

  return (
    <div className="flex flex-col gap-2.5 px-[18px] pt-6 pb-3 lg:px-16 lg:pt-12 lg:pb-6">
      <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">{t("label")}</p>
      <h1 className="text-4xl leading-none font-bold tracking-[-0.04em] lg:text-[56px]">{t("title")}</h1>
      <p className="max-w-[640px] text-[15px] leading-[1.6] text-foreground-soft lg:text-base lg:leading-[1.7]">
        {t("intro")}
      </p>
    </div>
  );
};
