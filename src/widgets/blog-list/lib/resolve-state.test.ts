import { describe, expect, it, vi } from "vitest";

import type { BlogCatalog } from "@/db/queries/blog";
import { type BlogListState, DEFAULT_BLOG_LIST_STATE } from "@/schemas/blog-list";

import { resolveBlogListState } from "./resolve-state";

const catalog: BlogCatalog = {
  topics: [
    { key: "technical", label: "Technical" },
    { key: "software", label: "Software" },
  ],
  tags: ["React", "Jest"],
  total: 11,
};

const counting = (count: number) => vi.fn(async () => count);
const state = (overrides: Partial<BlogListState>): BlogListState => ({ ...DEFAULT_BLOG_LIST_STATE, ...overrides });

describe("resolveBlogListState", () => {
  it("falls back to the default when the shape was invalid", async () => {
    const matchCount = counting(11);

    expect(await resolveBlogListState(null, catalog, matchCount)).toEqual({
      state: DEFAULT_BLOG_LIST_STATE,
      restored: false,
    });
    expect(matchCount).not.toHaveBeenCalled();
  });

  it("restores the default state itself", async () => {
    expect(await resolveBlogListState(DEFAULT_BLOG_LIST_STATE, catalog, counting(11))).toEqual({
      state: DEFAULT_BLOG_LIST_STATE,
      restored: true,
    });
  });

  it("restores a full state that exists", async () => {
    const full = state({ topic: "technical", tags: ["Jest", "React"], sort: "oldest", page: 2, per: 10 });

    expect(await resolveBlogListState(full, catalog, counting(11))).toEqual({ state: full, restored: true });
  });

  it.each([
    ["a hidden or unknown topic", state({ topic: "hobby" })],
    ["one unknown tag of two", state({ tags: ["React", "Vue"] })],
    ["a tag in another case", state({ tags: ["react"] })],
  ])("falls back to the default for %s, without counting", async (_, wanted) => {
    const matchCount = counting(11);

    expect(await resolveBlogListState(wanted, catalog, matchCount)).toEqual({
      state: DEFAULT_BLOG_LIST_STATE,
      restored: false,
    });
    expect(matchCount).not.toHaveBeenCalled();
  });

  it("checks the page against the matches of its own filters", async () => {
    const matchCount = counting(11);

    expect((await resolveBlogListState(state({ page: 2 }), catalog, matchCount)).restored).toBe(true);
    expect((await resolveBlogListState(state({ page: 3 }), catalog, matchCount)).restored).toBe(false);
    expect((await resolveBlogListState(state({ page: 2, per: 20 }), catalog, matchCount)).restored).toBe(false);

    await resolveBlogListState(state({ topic: "software", tags: ["Jest"], page: 2 }), catalog, matchCount);
    expect(matchCount).toHaveBeenLastCalledWith("software", ["Jest"]);
  });

  it("gives a filter with no match one page, the empty state", async () => {
    expect((await resolveBlogListState(state({ tags: ["Jest"] }), catalog, counting(0))).restored).toBe(true);
    expect((await resolveBlogListState(state({ tags: ["Jest"], page: 2 }), catalog, counting(0))).restored).toBe(
      false,
    );
  });

  it("does not count for page 1, which always exists", async () => {
    const matchCount = counting(0);

    await resolveBlogListState(state({ topic: "technical" }), catalog, matchCount);

    expect(matchCount).not.toHaveBeenCalled();
  });
});
