import { describe, expect, it } from "vitest";

import { type HideState, nextHideState } from "./hide-on-scroll";

const MAX = 2000;
const THRESHOLD = 10;

const run = (positions: number[], start: HideState = { hidden: false, lastY: positions[0], travel: 0 }) =>
  positions.slice(1).reduce((state, y) => nextHideState(state, y, MAX, THRESHOLD), start);

describe("nextHideState", () => {
  it("hides after scrolling down past the threshold", () => {
    expect(run([500, 504, 508, 511]).hidden).toBe(true);
  });

  it("shows again after scrolling up past the threshold", () => {
    const hidden = run([500, 520]);

    expect(run([520, 515, 509], hidden).hidden).toBe(false);
  });

  it("ignores a jitter shorter than the threshold", () => {
    expect(run([500, 505, 509]).hidden).toBe(false);
  });

  it("starts the travel over when the direction turns", () => {
    expect(run([500, 508, 506, 514]).hidden).toBe(false);
  });

  it.each([
    ["above the top", -40],
    ["below the bottom", MAX + 40],
  ])("ignores the rubber band %s", (_, y) => {
    const hidden = run([500, 520]);

    expect(nextHideState(hidden, y, MAX, THRESHOLD)).toEqual(hidden);
  });
});
