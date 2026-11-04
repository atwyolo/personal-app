import { describe, expect, it } from "vitest";

import { getReadingState } from "./reading-state";

const getSections = (...tops: number[]) => tops.map((top) => ({ top, height: 800 }));

const read = (sections: { top: number; height: number }[], atPageEnd = false) =>
  getReadingState({ sections, viewportHeight: 1000, atPageEnd });

describe("getReadingState", () => {
  it("keeps the first job active with nothing above the line", () => {
    expect(read(getSections(500, 1300, 2100))).toEqual({ active: 0, progress: [0, 0, 0] });
  });

  it("measures the first job from the line", () => {
    expect(read(getSections(100, 900, 1700))).toEqual({ active: 0, progress: [0.375, 0, 0] });
  });

  it("stays on a job until the next one rises above the line", () => {
    expect(read(getSections(-100, 700, 1500))).toEqual({ active: 0, progress: [0.625, 0, 0] });
  });

  it("moves to the last job above the line and fills the jobs before it", () => {
    expect(read(getSections(-900, -100, 700))).toEqual({ active: 1, progress: [1, 0.625, 0] });
  });

  it("does not count a top exactly at the line as above it", () => {
    expect(read(getSections(-400, 400, 1200)).active).toBe(0);
  });

  it("finishes everything at the end of the page", () => {
    expect(read(getSections(-1700, -900, -100), true)).toEqual({ active: 2, progress: [1, 1, 1] });
  });

  it("has nothing to report without sections", () => {
    expect(read([])).toEqual({ active: 0, progress: [] });
    expect(read([], true)).toEqual({ active: 0, progress: [] });
  });

  it("leaves a hidden section at zero instead of dividing by its height", () => {
    expect(read([{ top: 0, height: 0 }])).toEqual({ active: 0, progress: [0] });
  });
});
