import type { BlogCatalog } from "@/db/queries/blog";
import { type BlogListState, DEFAULT_BLOG_LIST_STATE } from "@/schemas/blog-list";

interface ResolvedBlogListState {
  state: BlogListState;
  /** False when the URL could not be restored completely: the page shows the default and cleans the address. */
  restored: boolean;
}

const fallback: ResolvedBlogListState = { state: DEFAULT_BLOG_LIST_STATE, restored: false };

/**
 * All or nothing (owner's rule): a parsed state is restored only when its topic is a visible topic, every tag exists
 * in this locale and its page is in range for its own filters; anything else is the default state.
 * Page 1 always exists (an empty result is the empty state), so only a later page costs a count.
 */
export const resolveBlogListState = async (
  parsed: BlogListState | null,
  catalog: BlogCatalog,
  matchCount: (topic: string | null, tags: string[]) => Promise<number>,
): Promise<ResolvedBlogListState> => {
  if (parsed === null) return fallback;

  const { topic, tags, page, per } = parsed;
  if (topic !== null && !catalog.topics.some((t) => t.key === topic)) return fallback;
  if (!tags.every((tag) => catalog.tags.includes(tag))) return fallback;

  if (page > 1) {
    const pageCount = Math.max(1, Math.ceil((await matchCount(topic, tags)) / per));
    if (page > pageCount) return fallback;
  }

  return { state: parsed, restored: true };
};
