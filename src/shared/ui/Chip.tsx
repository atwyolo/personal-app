import type { FC, ReactNode } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

interface ChipProps {
  children: ReactNode;
  /** Makes the chip a link through the router (a locale-less href): the blog list's tags toggle a filter. */
  href?: string;
  /** A linked chip that is part of the current filter: filled with `brand`, marked with `aria-current`. */
  selected?: boolean;
}

const chipClassName =
  "inline-block rounded-full border border-card-border px-2.5 py-[7px] font-mono text-xs leading-none font-medium text-brand lg:px-3 lg:py-2 lg:text-[13px]";

/** Mono pill with colored text and no fill (same in both themes): skill tags in the hero, experience and posts. */
export const Chip: FC<ChipProps> = (props) => {
  const { children, href, selected } = props;

  if (href === undefined) return <span className={chipClassName}>{children}</span>;

  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={cn(
        chipClassName,
        "outline-hidden transition-colors hover:bg-brand/10 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-brand aria-[current]:bg-brand aria-[current]:text-primary-foreground",
      )}
    >
      {children}
    </Link>
  );
};
