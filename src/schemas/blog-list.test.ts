import { describe, expect, it } from "vitest";

import {
  type BlogListState,
  buildBlogListHref,
  DEFAULT_BLOG_LIST_STATE,
  nextBlogListState,
  parseBlogListQuery,
} from "./blog-list";

const full: BlogListState = { topic: "technical", tags: ["React", "Team process"], sort: "oldest", page: 2, per: 20 };

/** What Next passes as `searchParams` for an href: decoded values, one string per key. */
const queryOf = (href: string) => Object.fromEntries(new URL(href, "https://example.com").searchParams);

describe("parseBlogListQuery", () => {
  it("reads no parameters as the default state", () => {
    expect(parseBlogListQuery({})).toEqual(DEFAULT_BLOG_LIST_STATE);
  });

  it("ignores parameters it does not know", () => {
    expect(parseBlogListQuery({ utm_source: "linkedin", fbclid: "x" })).toEqual(DEFAULT_BLOG_LIST_STATE);
  });

  it("reads every parameter, keeping the tags in their order", () => {
    expect(
      parseBlogListQuery({ topic: "technical", tags: "React,Team process", sort: "oldest", page: "2", per: "20" }),
    ).toEqual(full);
  });

  it("accepts defaults that are spelled out", () => {
    expect(parseBlogListQuery({ page: "1", sort: "newest", per: "10" })).toEqual(DEFAULT_BLOG_LIST_STATE);
  });

  it.each([
    ["an empty tag list", { tags: "" }],
    ["a repeated tag", { tags: "React,React" }],
    ["an empty tag after a comma", { tags: "React," }],
    ["page 0", { page: "0" }],
    ["a fractional page", { page: "1.5" }],
    ["a page that is not a number", { page: "abc" }],
    ["a page with a leading zero", { page: "02" }],
    ["a page size that is not offered", { per: "30" }],
    ["an unknown sort", { sort: "asc" }],
    ["an empty topic", { topic: "" }],
    ["two topics", { topic: ["a", "b"] }],
    ["repeated tag parameters", { tags: ["React", "Jest"] }],
  ])("rejects %s", (_, query) => {
    expect(parseBlogListQuery(query)).toBeNull();
  });
});

describe("buildBlogListHref", () => {
  it("writes the default state as the bare path", () => {
    expect(buildBlogListHref(DEFAULT_BLOG_LIST_STATE)).toBe("/blog");
  });

  it("writes only what differs from the default, in a fixed order, commas between tags as they are", () => {
    expect(buildBlogListHref(full)).toBe("/blog?topic=technical&tags=React,Team%20process&sort=oldest&page=2&per=20");
    expect(buildBlogListHref({ ...DEFAULT_BLOG_LIST_STATE, page: 3 })).toBe("/blog?page=3");
  });

  it("encodes non-ASCII letters and keeps dots", () => {
    expect(buildBlogListHref({ ...DEFAULT_BLOG_LIST_STATE, tags: ["Next.js", "Тесты"] })).toBe(
      "/blog?tags=Next.js,%D0%A2%D0%B5%D1%81%D1%82%D1%8B",
    );
  });

  it.each<BlogListState>([
    DEFAULT_BLOG_LIST_STATE,
    full,
    { ...DEFAULT_BLOG_LIST_STATE, tags: ["Next.js", "Тесты", "C++", "a&b=c"] },
    { ...DEFAULT_BLOG_LIST_STATE, per: 50, page: 4 },
  ])("survives a round trip through the URL: %j", (state) => {
    expect(parseBlogListQuery(queryOf(buildBlogListHref(state)))).toEqual(state);
  });
});

describe("nextBlogListState", () => {
  const onPage3: BlogListState = { ...full, page: 3 };

  it.each([
    ["a topic", { topic: "software" }],
    ["all topics", { topic: null }],
    ["an added tag", { addTag: "Jest" }],
    ["a removed tag", { removeTag: "React" }],
    ["cleared tags", { clearTags: true as const }],
    ["the sort", { sort: "newest" as const }],
    ["the page size", { per: 50 as const }],
  ])("goes back to page 1 on %s", (_, change) => {
    expect(nextBlogListState(onPage3, change).page).toBe(1);
  });

  it("changes only the page on a page change", () => {
    expect(nextBlogListState(onPage3, { page: 2 })).toEqual({ ...full, page: 2 });
  });

  it("adds a tag at the end and removes one by name", () => {
    expect(nextBlogListState(full, { addTag: "Jest" }).tags).toEqual(["React", "Team process", "Jest"]);
    expect(nextBlogListState(full, { removeTag: "React" }).tags).toEqual(["Team process"]);
    expect(nextBlogListState(full, { clearTags: true }).tags).toEqual([]);
  });

  it("changes nothing when the added tag is already selected", () => {
    expect(nextBlogListState(full, { addTag: "React" })).toEqual(full);
  });
});
