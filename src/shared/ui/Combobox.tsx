"use client";

import { XIcon } from "lucide-react";
import { type FC, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  Combobox as ComboboxRoot,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/shared/shadcn/ui/combobox";
import { InputGroupAddon, InputGroupButton } from "@/shared/shadcn/ui/input-group";

export interface ComboboxSuggestion {
  value: string;
  label: string;
  /** Shown on the right of the row, e.g. "3 posts". Part of the option's name. */
  hint: string;
}

interface ComboboxProps {
  /** Names the field for screen readers and shows as its placeholder. */
  label: string;
  clearLabel: string;
  /** Shown in the popover when nothing matches the text. */
  emptyText: string;
  suggestions: ComboboxSuggestion[];
  /** A suggestion was picked. The field then clears and closes. */
  onPick: (value: string) => void;
  /** While false a pick is ignored and the text stays, e.g. while the previous pick is still loading. */
  pickable?: boolean;
  onFocusChange?: (focused: boolean) => void;
  /** An icon at the start of the pill. */
  icon?: ReactNode;
  className?: string;
}

const matches = (suggestion: ComboboxSuggestion, query: string) =>
  suggestion.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

/**
 * A search field whose suggestions appear only while there is text: shadcn's Base UI combobox, used to pick one
 * suggestion at a time rather than to hold a value. Base UI gives the ARIA combobox pattern and the keyboard
 * (↑ ↓ move, Enter picks, Escape closes) and picks on pointer press, so the field's blur never closes the popover first.
 * The design's 44 px pill, 16 px text below `lg` (iOS Safari zooms into smaller text), an × that clears the text.
 */
export const Combobox: FC<ComboboxProps> = (props) => {
  const { label, clearLabel, emptyText, suggestions, onPick, pickable = true, onFocusChange, icon, className } = props;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const hasText = query.trim() !== "";

  return (
    <ComboboxRoot<ComboboxSuggestion>
      items={suggestions}
      value={null}
      inputValue={query}
      onInputValueChange={(next) => {
        setQuery(next);
        setOpen(next.trim() !== "");
      }}
      open={open && hasText}
      onOpenChange={setOpen}
      onValueChange={(picked) => {
        if (picked === null || !pickable) return;
        onPick(picked.value);
        setQuery("");
        setOpen(false);
      }}
      itemToStringLabel={(suggestion) => suggestion.label}
      filter={matches}
      autoHighlight={false}
    >
      <ComboboxInput
        showTrigger={false}
        aria-label={label}
        placeholder={label}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        className={cn(
          "h-11 rounded-full border-card-border bg-background px-1.5 text-muted-foreground dark:bg-background",
          "has-[[data-slot=input-group-control]:focus-visible]:border-brand has-[[data-slot=input-group-control]:focus-visible]:ring-brand/25",
          "*:data-[slot=input-group-control]:text-base *:data-[slot=input-group-control]:text-foreground lg:*:data-[slot=input-group-control]:text-[15px]",
          "*:data-[slot=input-group-control]:outline-hidden",
          className,
        )}
      >
        {icon && <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>}
        {/* Not in an `InputGroupAddon`: shadcn hides addons from assistive technology, and this button must be reachable. */}
        {hasText && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-label={clearLabel}
            className="order-last mr-1.5 rounded-full"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <XIcon aria-hidden />
          </InputGroupButton>
        )}
      </ComboboxInput>
      <ComboboxContent className="rounded-2xl border border-card-border bg-card p-1.5 shadow-lg ring-0">
        <ComboboxEmpty className="py-2.5 font-mono text-sm">{emptyText}</ComboboxEmpty>
        <ComboboxList className="p-0">
          {(suggestion: ComboboxSuggestion) => (
            <ComboboxItem
              key={suggestion.value}
              value={suggestion}
              className="h-10 justify-between rounded-lg px-3 font-mono text-sm data-highlighted:bg-foreground/8 data-highlighted:text-brand data-highlighted:**:text-brand"
            >
              <span>{suggestion.label}</span>
              <span className="text-xs text-muted-foreground">{suggestion.hint}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
};
