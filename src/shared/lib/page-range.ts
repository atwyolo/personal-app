export type PageItem = number | "ellipsis-start" | "ellipsis-end";

interface PageItemsParams {
  page: number;
  pageCount: number;
}

/** Pages shown on each side of the current one, and at each end of the row. */
const SIBLINGS = 1;
const BOUNDARIES = 1;

const range = (from: number, to: number): number[] =>
  from > to ? [] : Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * The items of a pagination row, by the rule of MUI's `usePagination` with one sibling and one boundary page:
 * `1 … 5 [6] 7 … 12`. Near either end the row fills up with pages instead, so it always holds the same number of
 * items (seven, once there are more than seven pages) and never changes width as the visitor pages through.
 */
export const getPageItems = (params: PageItemsParams): PageItem[] => {
  const { page, pageCount } = params;

  const startPages = range(1, Math.min(BOUNDARIES, pageCount));
  const endPages = range(Math.max(pageCount - BOUNDARIES + 1, BOUNDARIES + 1), pageCount);

  // The sibling window, pushed away from the ends so it never overlaps the boundary pages or their gap.
  const siblingsStart = Math.max(
    Math.min(page - SIBLINGS, pageCount - BOUNDARIES - SIBLINGS * 2 - 1),
    BOUNDARIES + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + SIBLINGS, BOUNDARIES + SIBLINGS * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : pageCount - 1,
  );

  // Each gap is an ellipsis when it hides more than one page, the page itself when it hides exactly one.
  const startGap: PageItem[] =
    siblingsStart > BOUNDARIES + 2
      ? ["ellipsis-start"]
      : BOUNDARIES + 1 < pageCount - BOUNDARIES
        ? [BOUNDARIES + 1]
        : [];
  const endGap: PageItem[] =
    siblingsEnd < pageCount - BOUNDARIES - 1
      ? ["ellipsis-end"]
      : pageCount - BOUNDARIES > BOUNDARIES
        ? [pageCount - BOUNDARIES]
        : [];

  return [...startPages, ...startGap, ...range(siblingsStart, siblingsEnd), ...endGap, ...endPages];
};
