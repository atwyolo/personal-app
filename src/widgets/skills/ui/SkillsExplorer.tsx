"use client";

import { useTranslations } from "next-intl";
import { type FC, useLayoutEffect, useRef, useState } from "react";

import type { SkillList } from "@/db/queries/home";
import { SkillRow } from "@/features/skill-row/SkillRow";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { useHideOnScroll } from "@/shared/lib/useHideOnScroll";
import { useIsStuck } from "@/shared/lib/useIsStuck";
import { ChipGroup } from "@/shared/ui/ChipGroup";
import { ScrollFade } from "@/shared/ui/ScrollFade";
import { SearchField } from "@/shared/ui/SearchField";
import { Tile } from "@/shared/ui/Tile";

import { filterSkills } from "../lib/filter-skills";

/**
 * The chip value of "every domain". Not empty: Base UI treats an empty toggle value as missing and puts a generated id
 * in its place. Domain keys are words (`core`, `tools`), so `*` never collides with one.
 */
const ALL = "*";
const SEARCH_DELAY_MS = 300;
/** Pixels of scrolling in one direction before the phone panel folds or unfolds: less is a finger's jitter. */
const FOLD_THRESHOLD_PX = 10;

/** A cleared field shows everything at once: waiting 300 ms there only feels slow. */
const isBlank = (query: string) => query.trim() === "";

interface SkillsExplorerProps {
  /** Already in the page's order (level desc, then sort, then name): filtering only hides rows. */
  skills: SkillList["skills"];
  domains: SkillList["domains"];
}

/**
 * The full skills list with its search and domain chips. The list arrives with the HTML, so the page reads without
 * JavaScript; the filters work once this hydrates. The filters live only while the visitor is on the page
 * (owner's decision): Next keeps a left route mounted under `<Activity>`, so they reset each time it is shown again.
 */
export const SkillsExplorer: FC<SkillsExplorerProps> = (props) => {
  const { skills, domains } = props;
  const t = useTranslations("SkillsPage");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState(ALL);
  const [searchFocused, setSearchFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { stuck } = useIsStuck({ ref: panelRef });
  const { hidden } = useHideOnScroll({ threshold: FOLD_THRESHOLD_PX });
  // Phones fold the stuck panel while the visitor scrolls down, never while they type (the keyboard is open).
  const collapsed = stuck && hidden && !searchFocused;
  const { debouncedValue: appliedQuery } = useDebouncedValue({
    value: query,
    delay: SEARCH_DELAY_MS,
    isImmediate: isBlank,
  });

  // `<Activity>` runs effect cleanups when it hides the route, so the filters reset as the visitor leaves and the page
  // comes back fresh, with no frame of the old list. On a real unmount the update is dropped, which is fine.
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
  // A chip counts what choosing it would show for the applied query (owner's correction); "All" counts every match.
  const matching = filterSkills(skills, { query: appliedQuery, domain: null });
  const chips = [
    { value: ALL, label: t("all"), count: matching.length },
    ...domains.map((d) => ({ value: d.key, label: d.label, count: matching.filter((s) => s.domain === d.key).length })),
  ];

  return (
    <div className="flex flex-col px-3.5 pb-8 lg:px-16 lg:pb-14">
      {/* The count alone on the right (owner's correction: no "All skills" label). `status` is a polite live region. */}
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
        {/*
          Desktop: sticky under the 73 px site header, 20 px below it, as the handoff's `top: 20px` inside its frame.
          Phones (owner's request): sticky right under the 64 px header, across the tile's inner width, on the tile's
          color so the rows pass under it. Folded, only its `top` moves: 2 px puts the search (12 px padding, 44 px
          field, 14 px gap) behind the header and the chips 8 px under it, and the panel's height in the flow never
          changes, so the list does not move. `-my-3 py-3` keeps the resting layout as it was.
          `--stick-top` holds the unfolded offset for `useIsStuck`: the transitioning `top` cannot tell it.
        */}
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
          {/* The group carries this name for screen readers; the visible label repeats it for the eye, on desktop. */}
          <p
            aria-hidden
            className="hidden font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase lg:block"
          >
            {t("domain")}
          </p>
          {/* Phones: one swipeable row (owner's choice), with 4 px of room so the focus ring is not clipped. */}
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
          // `overflow-wrap: anywhere`: a long query without spaces wraps instead of widening the page.
          <p className="text-[15px] [overflow-wrap:anywhere] text-foreground-soft">
            {t("noMatch", { query: appliedQuery.trim() })}
          </p>
        )}
      </Tile>
    </div>
  );
};
