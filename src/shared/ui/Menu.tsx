import type { FC, ReactElement, ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn/ui/dropdown-menu";

export interface MenuItem {
  value: string;
  label: ReactNode;
  /** Secondary text at the end of the item, e.g. a locale code or "now dark". */
  hint?: ReactNode;
}

interface MenuProps {
  /** Element that opens the menu, usually our Button with an aria-label. Receives the trigger props and ref. */
  trigger: ReactElement;
  /** Accessible name of the menu. */
  label: string;
  items: MenuItem[];
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Single-choice dropdown menu (locale, theme) as data: items, value, onValueChange.
 * Adapter over shadcn DropdownMenu + RadioGroup (Base UI); their compound parts and `render` prop stay inside.
 * No "use client": the shadcn file is the client boundary, and consumers are client components anyway.
 */
export const Menu: FC<MenuProps> = (props) => {
  const { trigger, label, items, value, onValueChange } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        aria-label={label}
        align="end"
        sideOffset={8}
        className="w-auto min-w-[210px] rounded-2xl border border-card-border bg-popover p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] ring-0"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={(next: string) => onValueChange(next)}>
          {items.map((item) => (
            <DropdownMenuRadioItem
              key={item.value}
              value={item.value}
              closeOnClick
              // `**`: the shadcn item repaints its descendants on focus, so the selected color has to reach them too.
              className="min-h-10 gap-2.5 rounded-[10px] py-0 pr-9 pl-3 text-[15px] font-medium focus:bg-accent data-checked:text-brand data-checked:**:text-brand focus:data-checked:text-brand focus:data-checked:**:text-brand [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-3"
            >
              <span className="grow">{item.label}</span>
              {item.hint ? (
                <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">{item.hint}</span>
              ) : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
