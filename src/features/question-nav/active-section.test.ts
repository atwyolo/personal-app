import { describe, expect, it } from "vitest";

import { getActiveSection } from "./active-section";

describe("getActiveSection", () => {
  it.each([
    { name: "starts on the first section", sectionTops: [369, 665, 989], active: 0 },
    { name: "takes the section nearest to the edge from below", sectionTops: [-300, 150, 700], active: 1 },
    { name: "skips a section that has gone above the edge", sectionTops: [99, 101, 700], active: 1 },
    { name: "counts a top exactly on the edge", sectionTops: [50, 100, 700], active: 1 },
    { name: "stays on the last section once all have gone above", sectionTops: [-900, -500, -20], active: 2 },
    { name: "handles no sections", sectionTops: [], active: 0 },
  ])("$name", ({ sectionTops, active }) => {
    expect(getActiveSection({ sectionTops, edge: 100 })).toBe(active);
  });
});
