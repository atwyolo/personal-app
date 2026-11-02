interface ActiveSectionParams {
  /** Top of each section relative to the viewport, in px, in reading order. */
  sectionTops: number[];
  /** Where the visible page starts: the bottom of the sticky bars, in px. */
  edge: number;
}

/**
 * The index of the section nearest to the edge from below. The owner's rule of 2026-11-02: a section that has gone
 * above the edge no longer counts, so a section near the end of the page, which cannot rise that far, is never reached.
 * Once every section has gone above, the last one stays.
 */
export const getActiveSection = (params: ActiveSectionParams): number => {
  const { sectionTops, edge } = params;

  const next = sectionTops.findIndex((top) => top >= edge);

  return next === -1 ? Math.max(sectionTops.length - 1, 0) : next;
};
