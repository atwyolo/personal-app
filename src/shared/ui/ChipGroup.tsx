"use client";

import type { FC } from "react";

import { cn } from "@/shared/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/shadcn/ui/toggle-group";

interface ChipGroupItem {
  value: string;
  label: string;
  count: number;
}

interface ChipGroupProps {
  label: string;
  items: ChipGroupItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

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
          className="h-9 min-h-9 rounded-full border border-border px-3.5 font-mono lg:inline-block lg:h-auto lg:max-w-full lg:shrink lg:py-[9px] lg:text-left lg:whitespace-normal lg:wrap-break-word text-xs font-normal text-foreground-soft outline-hidden hover:bg-muted focus-visible:ring-ring aria-pressed:border-selected aria-pressed:bg-selected aria-pressed:text-selected-foreground aria-pressed:hover:bg-selected"
        >
          {item.label}{" "}
          <span className="text-muted-foreground in-aria-pressed:text-selected-foreground in-aria-pressed:opacity-70">
            {item.count}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
