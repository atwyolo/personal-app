"use client";

import { useTranslations } from "next-intl";
import { type FC, useLayoutEffect, useRef, useState } from "react";

import type { SkillList } from "@/content/skills";
import { SkillRow } from "@/features/skill-row/SkillRow";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { useFoldingPanel } from "@/shared/lib/useFoldingPanel";
import { ChipGroup } from "@/shared/ui/ChipGroup";
import { ScrollFade } from "@/shared/ui/ScrollFade";
import { SearchField } from "@/shared/ui/SearchField";
import { Tile } from "@/shared/ui/Tile";

import { filterSkills } from "../lib/filter-skills";

const ALL = "*";
const SEARCH_DELAY_MS = 300;
const isBlank = (query: string) => query.trim() === "";

interface SkillsExplorerProps {
  skills: SkillList["skills"];
  domains: SkillList["domains"];
}

export const SkillsExplorer: FC<SkillsExplorerProps> = (props) => {
  const { skills, domains } = props;
  const t = useTranslations("Pages.Skills");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState(ALL);
  const [searchFocused, setSearchFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { stuck, collapsed } = useFoldingPanel({ ref: panelRef, focused: searchFocused });
  const { debouncedValue: appliedQuery } = useDebouncedValue({
    value: query,
    delay: SEARCH_DELAY_MS,
    isImmediate: isBlank,
  });

  useLayoutEffect(
    () => () => {
      setQuery("");
      setDomain(ALL);
    },
    [],
  );

  const shown = filterSkills(skills, { query: appliedQuery, domain: domain === ALL ? null : domain });
  const total = skills.length;
  const isFiltered = !isBlank(appliedQuery) || domain !== ALL;
  const matching = filterSkills(skills, { query: appliedQuery, domain: null });
  const chips = [
    { value: ALL, label: t("all"), count: matching.length },
    ...domains.map((d) => ({ value: d.key, label: d.label, count: matching.filter((s) => s.domain === d.key).length })),
  ];

  return (
    <div className="flex flex-col px-3.5 pb-8 lg:px-16 lg:pb-14">
      <div className="flex justify-end px-2 pt-1 pb-2 lg:px-1 lg:pb-2.5">
        <p
          role="status"
          aria-live="polite"
          className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase lg:text-xs"
        >
          {isFiltered ? t("countFiltered", { shown: shown.length, total }) : t("countAll", { total })}
        </p>
      </div>
      <Tile className="gap-3.5 rounded-[20px] p-5 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:rounded-3xl lg:p-7">
        <div
          ref={panelRef}
          data-filter-panel=""
          data-stuck={stuck ? "" : undefined}
          data-collapsed={collapsed ? "" : undefined}
          onFocus={(event) => setSearchFocused(event.target instanceof HTMLInputElement)}
          onBlur={() => setSearchFocused(false)}
          className="sticky top-(--stick-top) z-[5] -mx-5 -my-3 flex flex-col gap-3.5 bg-card px-5 py-3 transition-[top] duration-200 [--stick-top:64px] motion-reduce:transition-none data-collapsed:top-0.5 data-stuck:shadow-[0_1px_0_var(--color-card-border)] lg:z-auto lg:mx-0 lg:my-0 lg:border-r lg:border-card-border lg:bg-transparent lg:py-0 lg:pr-6 lg:pl-0 lg:transition-none lg:[--stick-top:93px] lg:data-collapsed:top-(--stick-top) lg:data-stuck:shadow-none"
        >
          <SearchField label={t("search")} value={query} onValueChange={setQuery} />
          <p
            aria-hidden
            className="hidden font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase lg:block"
          >
            {t("domain")}
          </p>
          <ScrollFade className="max-lg:-m-1 max-lg:p-1">
            <ChipGroup
              label={t("domain")}
              items={chips}
              value={domain}
              onValueChange={setDomain}
              className="max-lg:w-max max-lg:flex-nowrap"
            />
          </ScrollFade>
        </div>
        {shown.length > 0 ? (
          <ul className="grid min-w-0 gap-3.5 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-[18px]">
            {shown.map((skill) => (
              <li key={skill.name}>
                <SkillRow skill={skill} layout="list" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] [overflow-wrap:anywhere] text-foreground-soft">
            {t("noMatch", { query: appliedQuery.trim() })}
          </p>
        )}
      </Tile>
    </div>
  );
};
