"use client";

import type { FC } from "react";

import { cn } from "@/shared/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/shadcn/ui/toggle-group";

interface ChipGroupItem {
  /** Never empty: Base UI treats an empty toggle value as missing and puts a generated id in its place. */
  value: string;
  label: string;
  count: number;
}

interface ChipGroupProps {
  /** Names the group for screen readers. */
  label: string;
  items: ChipGroupItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Layout only. */
  className?: string;
}

/**
 * Single-select filter chips on the Base UI toggle group: one Tab stop for the group, arrows between the chips,
 * `aria-pressed` on each. Exactly one chip stays pressed: Base UI lets a pressed chip be unpressed, which is ignored.
 */
export const ChipGroup: FC<ChipGroupProps> = (props) => {
  const { label, items, value, onValueChange, className } = props;

  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const [pressed] = next;
        if (pressed !== undefined && pressed !== value) onValueChange(pressed);
      }}
      spacing={1.5}
      className={cn("w-auto flex-wrap", className)}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          // The design's filter chip: a 36 px mono pill; the pressed one takes the `selected` colors.
          // `outline-hidden` and the solid ring, as on the buttons: forced colors show the outline instead.
          className="h-9 min-h-9 rounded-full border border-border px-3.5 font-mono text-xs font-normal text-foreground-soft outline-hidden hover:bg-muted focus-visible:ring-ring aria-pressed:border-selected aria-pressed:bg-selected aria-pressed:text-selected-foreground aria-pressed:hover:bg-selected"
        >
          {/* The space is the gap (a mono space is 0.6em, ~7 px) and keeps the name "All 41", not "All41".
              The count is quieter than the label by its color, not by the design's 70% opacity: that left 3.9:1 in the
              light theme, under the 4.5:1 of WCAG 1.4.3. On the pressed chip the dark fill keeps 70% well above it. */}
          {item.label}{" "}
          <span className="text-muted-foreground in-aria-pressed:text-selected-foreground in-aria-pressed:opacity-70">
            {item.count}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
