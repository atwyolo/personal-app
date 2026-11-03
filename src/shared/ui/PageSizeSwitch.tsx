import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

import { paginationSquareClassName } from "./Pagination";

interface PageSizeSwitchProps {
  /** Names the group. */
  label: string;
  sizes: readonly number[];
  current: number;
  /** A locale-less href; the router adds the locale. */
  hrefFor: (size: number) => string;
  /** An element id: inside a `NavigationScope`, the view moves there once the new size has rendered. */
  scrollTarget?: string;
  className?: string;
}

/** Every page size visible at once, as links in the pagination's squares (owner's choice over a select). */
export const PageSizeSwitch: FC<PageSizeSwitchProps> = (props) => {
  const { label, sizes, current, hrefFor, scrollTarget, className } = props;

  return (
    <div role="group" aria-label={label} className={cn("flex items-center gap-1", className)}>
      {sizes.map((size) => (
        <Link
          key={size}
          href={hrefFor(size)}
          aria-current={size === current ? "true" : undefined}
          data-scope-scroll={scrollTarget}
          className={paginationSquareClassName}
        >
          {size}
        </Link>
      ))}
    </div>
  );
};
