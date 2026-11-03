import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedSlugs = vi.fn(async () => ["demo-post-4"]);
const getPost = vi.fn(async () => ({ slug: "demo-post-4" }));
vi.mock("@/db/queries/blog", () => ({ getPublishedSlugs, getPost }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { loadPost } = await import("./load-post");

beforeEach(() => {
  getPost.mockClear();
});

describe("loadPost", () => {
  it("loads a published slug", async () => {
    await expect(loadPost("en", "demo-post-4")).resolves.toEqual({ slug: "demo-post-4" });
  });

  // An exact match: another case is another address, so it is the 404 page and never a second copy of the post.
  it.each(["Demo-Post-4", "DEMO-POST-4", "nope"])("is the 404 page for %s, without reading a post", async (slug) => {
    await expect(loadPost("en", slug)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getPost).not.toHaveBeenCalled();
  });
});
