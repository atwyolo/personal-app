import { describe, expect, it } from "vitest";

import { getPageItems } from "./page-range";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

describe("getPageItems", () => {
  it("shows a single page", () => {
    expect(getPageItems({ page: 1, pageCount: 1 })).toEqual([1]);
  });

  it.each([1, 3, 5])("shows every page of five, on page %i", (page) => {
    expect(getPageItems({ page, pageCount: 5 })).toEqual(range(1, 5));
  });

  it("shows every page of seven without an ellipsis", () => {
    expect(getPageItems({ page: 4, pageCount: 7 })).toEqual(range(1, 7));
  });

  it.each([
    [1, [1, 2, 3, 4, 5, "ellipsis-end", 12]],
    [4, [1, 2, 3, 4, 5, "ellipsis-end", 12]],
    [5, [1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12]],
    [6, [1, "ellipsis-start", 5, 6, 7, "ellipsis-end", 12]],
    [8, [1, "ellipsis-start", 7, 8, 9, "ellipsis-end", 12]],
    [9, [1, "ellipsis-start", 8, 9, 10, 11, 12]],
    [12, [1, "ellipsis-start", 8, 9, 10, 11, 12]],
  ])("follows MUI's rule for 12 pages, on page %i", (page, items) => {
    expect(getPageItems({ page, pageCount: 12 })).toEqual(items);
  });

  it("keeps seven items for every page of 8 to 20 pages, so the row never changes width", () => {
    for (let pageCount = 8; pageCount <= 20; pageCount += 1) {
      for (let page = 1; page <= pageCount; page += 1) {
        expect(getPageItems({ page, pageCount }), `page ${page} of ${pageCount}`).toHaveLength(7);
      }
    }
  });

  it("always includes the first, the last and the current page", () => {
    for (let page = 1; page <= 20; page += 1) {
      expect(getPageItems({ page, pageCount: 20 })).toEqual(expect.arrayContaining([1, page, 20]));
    }
  });
});
