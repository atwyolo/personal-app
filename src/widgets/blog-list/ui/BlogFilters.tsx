"use client";

import { type FC, type ReactNode, useRef, useState } from "react";

import { TagSearch } from "@/features/tag-search/TagSearch";
import type { BlogListState } from "@/schemas/blog-list";
import { useFoldingPanel } from "@/shared/lib/useFoldingPanel";
import { ScrollFade } from "@/shared/ui/ScrollFade";

interface BlogFiltersProps {
  state: BlogListState;
  suggestions: { tag: string; count: number }[];
  topicsLabel: string;
  /** The visible label above the selected tags, on desktop. */
  selectedLabel: string;
  /** The topic chips, rendered on the server as links. */
  topics: ReactNode;
  /** The selected tags with their × and Reset, or `null` when none is selected. */
  selected: ReactNode;
}

/**
 * The filter panel, a card: the tag search, the topic chips, the selected tags, in this order at every width (owner's
 * choice, so the Skills folding works: only the search slides away). Desktop: in the aside, sticky 20 px under the
 * 73 px header. Phones: sticky right under the 64 px header; scrolling down moves only its sticky `top` (64 px →
 * 2 px): 12 px padding, the 44 px field and the 14 px gap go behind the header and the chips stay 8 px under it.
 * The width never changes when it sticks (as on Skills, a bar growing sideways at that moment looked broken), and
 * the list never moves.
 */
export const BlogFilters: FC<BlogFiltersProps> = (props) => {
  const { state, suggestions, topicsLabel, selectedLabel, topics, selected } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const { stuck, collapsed } = useFoldingPanel({ ref: panelRef, focused: searchFocused });

  return (
    <div
      ref={panelRef}
      data-filter-panel=""
      data-stuck={stuck ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      className="sticky top-(--stick-top) z-[5] flex flex-col gap-3.5 rounded-[20px] border border-card-border bg-card px-4 py-3 transition-[top] duration-200 [--stick-top:64px] motion-reduce:transition-none data-collapsed:top-0.5 data-stuck:shadow-[0_8px_16px_-12px_rgb(0_0_0/0.5)] lg:z-auto lg:gap-5 lg:rounded-3xl lg:p-[22px] lg:transition-none lg:[--stick-top:93px] lg:data-collapsed:top-(--stick-top) lg:data-stuck:shadow-none"
    >
      <TagSearch state={state} suggestions={suggestions} onFocusChange={setSearchFocused} />
      <div className="flex flex-col gap-2.5">
        {/* The group carries this name for screen readers; the visible label repeats it for the eye, on desktop. */}
        <p aria-hidden className="hidden font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase lg:block">
          {topicsLabel}
        </p>
        {/* Phones: one swipeable row, with 4 px of room so the focus ring is not clipped. */}
        <ScrollFade className="max-lg:-m-1 max-lg:p-1">{topics}</ScrollFade>
      </div>
      {selected && (
        <div className="flex flex-col gap-2.5">
          <p aria-hidden className="hidden font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase lg:block">
            {selectedLabel}
          </p>
          {selected}
        </div>
      )}
    </div>
  );
};
