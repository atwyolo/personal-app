import type { FC } from "react";

import { BackLink } from "@/shared/ui/BackLink";

interface PageHeroProps {
  backLabel: string;
  title: string;
  intro: string;
}

export const PageHero: FC<PageHeroProps> = (props) => {
  const { backLabel, title, intro } = props;

  return (
    <div className="px-[18px] pt-6 pb-3 lg:px-16 lg:pt-12 lg:pb-6">
      <BackLink label={backLabel} />
      <div className="flex flex-col gap-2.5">
        <h1 className="text-4xl leading-none font-bold tracking-[-0.04em] lg:text-[56px]">{title}</h1>
        <p className="max-w-[640px] text-[15px] leading-[1.6] text-foreground-soft lg:text-base lg:leading-[1.7]">{intro}</p>
      </div>
    </div>
  );
};
