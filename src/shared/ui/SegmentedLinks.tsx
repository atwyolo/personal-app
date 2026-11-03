import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

interface SegmentedLinkItem {
  key: string;
  label: string;
  /** A locale-less href; the router adds the locale. */
  href: string;
  current: boolean;
}

interface SegmentedLinksProps {
  /** Names the group. */
  label: string;
  items: SegmentedLinkItem[];
  className?: string;
}

/** A segmented control whose segments are addresses, such as "Newest | Oldest": a pill of links, one current. */
export const SegmentedLinks: FC<SegmentedLinksProps> = (props) => {
  const { label, items, className } = props;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex rounded-full border border-card-border bg-card p-1", className)}
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.current ? "true" : undefined}
          className="inline-flex h-8 items-center rounded-full px-3.5 font-mono text-xs text-foreground-soft outline-hidden transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:bg-selected aria-[current]:text-selected-foreground"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};
