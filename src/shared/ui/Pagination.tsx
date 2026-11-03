import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { getPageItems } from "@/shared/lib/page-range";
import { cn } from "@/shared/lib/utils";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/shared/shadcn/ui/pagination";

/**
 * The square of MUI's "Rounded" pagination without borders, in the site's tokens: 40 px for a finger below `lg`,
 * 32 px from `lg` as in MUI; the current item filled with `selected`. Shared with `PageSizeSwitch`.
 */
export const paginationSquareClassName =
  "inline-flex size-10 items-center justify-center rounded-lg font-mono text-sm text-foreground-soft tabular-nums outline-hidden transition-colors hover:bg-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:bg-selected aria-[current]:text-selected-foreground aria-[current]:hover:bg-selected lg:size-8 lg:text-[13px]";

interface PaginationProps {
  /** Names the navigation landmark. */
  label: string;
  page: number;
  pageCount: number;
  /** A locale-less href; the router adds the locale. */
  hrefFor: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
  /** An element id: inside a `NavigationScope`, the view moves there once the new page has rendered. */
  scrollTarget?: string;
  className?: string;
}

/**
 * Numbered pages as real links, so they work before hydration, open in a new tab and can be crawled.
 * Built on shadcn's markup (`nav > ul > li`), with next-intl's `Link` in place of its plain anchor and our labels in
 * place of its English ones. A single page needs no pagination, so it renders nothing.
 */
export const Pagination: FC<PaginationProps> = (props) => {
  const { label, page, pageCount, hrefFor, previousLabel, nextLabel, pageLabel, scrollTarget, className } = props;

  if (pageCount <= 1) return null;

  const step = (target: number, stepLabel: string, Icon: typeof ChevronLeftIcon) =>
    target < 1 || target > pageCount ? (
      // The end of the row: a disabled button, as in MUI. Named, so a screen reader lists it as unavailable, and not
      // focusable; a `span` with `aria-label` and no role is invalid ARIA (Lighthouse `aria-prohibited-attr`).
      <button
        type="button"
        disabled
        aria-label={stepLabel}
        className={cn(paginationSquareClassName, "opacity-40 hover:bg-transparent")}
      >
        <Icon aria-hidden className="size-4" />
      </button>
    ) : (
      <Link
        href={hrefFor(target)}
        aria-label={stepLabel}
        data-scope-scroll={scrollTarget}
        className={paginationSquareClassName}
      >
        <Icon aria-hidden className="size-4" />
      </Link>
    );

  return (
    <PaginationRoot aria-label={label} className={cn("mx-0 w-auto justify-start", className)}>
      <PaginationContent className="gap-1">
        <PaginationItem>{step(page - 1, previousLabel, ChevronLeftIcon)}</PaginationItem>
        {getPageItems({ page, pageCount }).map((item) => (
          <PaginationItem key={item}>
            {typeof item === "number" ? (
              <Link
                href={hrefFor(item)}
                aria-label={pageLabel(item)}
                aria-current={item === page ? "page" : undefined}
                data-scope-scroll={scrollTarget}
                className={paginationSquareClassName}
              >
                {item}
              </Link>
            ) : (
              <PaginationEllipsis className="size-10 text-muted-foreground lg:size-8" />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>{step(page + 1, nextLabel, ChevronRightIcon)}</PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
};
