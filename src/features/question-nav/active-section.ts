interface ActiveSectionParams {
  sectionTops: number[];
  edge: number;
}

export const getActiveSection = (params: ActiveSectionParams): number => {
  const { sectionTops, edge } = params;

  const next = sectionTops.findIndex((top) => top >= edge);

  return next === -1 ? Math.max(sectionTops.length - 1, 0) : next;
};
