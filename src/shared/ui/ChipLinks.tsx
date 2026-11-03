import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

interface ChipLinkItem {
  key: string;
  label: string;
  count?: number;
  /** A locale-less href; the router adds the locale. */
  href: string;
  current: boolean;
}

interface ChipLinksProps {
  /** Names the group. */
  label: string;
  items: ChipLinkItem[];
  className?: string;
}

/**
 * Single-choice filter chips whose choices are addresses: each chip is a link, the current one is marked with
 * `aria-current`. The look of `ChipGroup`, which serves filters that live in the page, not in the URL.
 */
export const ChipLinks: FC<ChipLinksProps> = (props) => {
  const { label, items, className } = props;

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.current ? "true" : undefined}
          // `ChipGroup`'s chip: a 36 px mono pill, the current one in the `selected` colors.
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 font-mono text-xs whitespace-nowrap text-foreground-soft outline-hidden transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-selected aria-[current]:bg-selected aria-[current]:text-selected-foreground aria-[current]:hover:bg-selected"
        >
          {/* The space keeps the name "All 11"; a flex container drops it from the layout, so `gap` draws the space.
              The count is quieter by its color (WCAG 1.4.3, as on Skills). */}
          {item.label}
          {item.count !== undefined && (
            <>
              {" "}
              <span className="text-muted-foreground in-aria-[current]:text-selected-foreground in-aria-[current]:opacity-70">
                {item.count}
              </span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
};
