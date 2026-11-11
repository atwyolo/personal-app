import { useTranslations } from "next-intl";
import type { FC } from "react";

import { cn } from "@/shared/lib/utils";

const SEGMENTS = 10;

const layouts = {
  home: {
    row: "grid-cols-[minmax(0,1fr)_44px] gap-x-3.5 gap-y-1.5 lg:grid-cols-[150px_minmax(0,1fr)_44px]",
    name: "col-span-2 text-[15px] lg:col-span-1 lg:text-base",
    bar: "",
    level: "text-right lg:text-left",
  },
  list: {
    row: "grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1.5 lg:grid-cols-[132px_minmax(0,1fr)_40px] lg:gap-3",
    name: "col-start-1 row-start-1 text-[15px]",
    bar: "col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1",
    level: "col-start-2 row-start-1 text-right lg:col-start-3 lg:text-left",
  },
} as const;

interface SkillRowProps {
  skill: { name: string; level: number };
  layout?: keyof typeof layouts;
}

export const SkillRow: FC<SkillRowProps> = (props) => {
  const { skill, layout = "home" } = props;
  const { name, level } = skill;
  const t = useTranslations("Pages.Common.SkillRow");
  const cells = layouts[layout];

  return (
    <div
      role="meter"
      aria-label={t("levelAria", { name, level })}
      aria-valuenow={level}
      aria-valuemin={1}
      aria-valuemax={SEGMENTS}
      aria-valuetext={t("level", { level })}
      className={cn("grid items-center", cells.row)}
    >
      <span className={cn("font-medium", cells.name)}>{name}</span>
      <div className={cn("grid grid-cols-10 gap-[3px] lg:gap-1", cells.bar)}>
        {Array.from({ length: SEGMENTS }, (_, segment) => (
          <i key={segment} className={cn("h-2 rounded-[2px] lg:h-2.5", segment < level ? "bg-brand" : "bg-placeholder")} />
        ))}
      </div>
      <span className={cn("font-mono text-xs whitespace-nowrap text-muted-foreground", cells.level)}>
        {t("level", { level })}
      </span>
    </div>
  );
};
