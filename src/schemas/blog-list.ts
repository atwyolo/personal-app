import { z } from "zod";

export type BlogSort = "newest" | "oldest";

export const PAGE_SIZES = [10, 20, 50] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

/** The blog list's state, which lives in the URL: `/blog?topic=…&tags=…&sort=…&page=…&per=…`. */
export interface BlogListState {
  /** A topic's `key`, or `null` for all topics. */
  topic: string | null;
  /** Tags as stored, in the order they were picked. A post matches when it has any of them. */
  tags: string[];
  sort: BlogSort;
  page: number;
  per: PageSize;
}

export const DEFAULT_BLOG_LIST_STATE: BlogListState = { topic: null, tags: [], sort: "newest", page: 1, per: 10 };

const TAG_SEPARATOR = ",";

/**
 * The shape of the query, before the database says whether the topic and the tags exist.
 * One string per key: a repeated parameter arrives as an array and fails. Unknown keys are dropped (`strip`).
 * The page is written without leading zeros, so each state has one address.
 */
const blogListQuery = z.object({
  topic: z.string().min(1).optional(),
  tags: z
    .string()
    .transform((value) => value.split(TAG_SEPARATOR))
    .refine((tags) => tags.every((tag) => tag !== ""), "empty tag")
    .refine((tags) => new Set(tags).size === tags.length, "repeated tag")
    .optional(),
  sort: z.enum(["newest", "oldest"]).optional(),
  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .optional(),
  per: z
    .enum(PAGE_SIZES.map(String) as [`${PageSize}`, ...`${PageSize}`[]])
    .transform((value) => Number(value) as PageSize)
    .optional(),
});

/**
 * Reads Next's `searchParams` (already decoded). `null` when the shape is invalid; the caller then shows the default
 * state. Whether the topic and the tags exist, and whether the page is in range, is checked against the database.
 */
export const parseBlogListQuery = (query: Record<string, string | string[] | undefined>): BlogListState | null => {
  const result = blogListQuery.safeParse(query);
  if (!result.success) return null;

  const { topic, tags, sort, page, per } = result.data;
  return {
    topic: topic ?? DEFAULT_BLOG_LIST_STATE.topic,
    tags: tags ?? DEFAULT_BLOG_LIST_STATE.tags,
    sort: sort ?? DEFAULT_BLOG_LIST_STATE.sort,
    page: page ?? DEFAULT_BLOG_LIST_STATE.page,
    per: per ?? DEFAULT_BLOG_LIST_STATE.per,
  };
};

/**
 * The locale-less href of a state; next-intl's `Link` adds the locale. Defaults are never written.
 * Built by hand: `URLSearchParams` would encode the commas between tags as `%2C`.
 */
export const buildBlogListHref = (state: BlogListState): string => {
  const { topic, tags, sort, page, per } = state;
  const parts: string[] = [];

  if (topic !== null) parts.push(`topic=${encodeURIComponent(topic)}`);
  if (tags.length > 0) parts.push(`tags=${tags.map(encodeURIComponent).join(TAG_SEPARATOR)}`);
  if (sort !== DEFAULT_BLOG_LIST_STATE.sort) parts.push(`sort=${sort}`);
  if (page !== DEFAULT_BLOG_LIST_STATE.page) parts.push(`page=${page}`);
  if (per !== DEFAULT_BLOG_LIST_STATE.per) parts.push(`per=${per}`);

  return parts.length > 0 ? `/blog?${parts.join("&")}` : "/blog";
};

export type BlogListChange =
  | { topic: string | null }
  | { addTag: string }
  | { removeTag: string }
  | { clearTags: true }
  | { sort: BlogSort }
  | { page: number }
  | { per: PageSize };

/** The state after one change. Every change but the page itself goes back to page 1 (owner's rule). */
export const nextBlogListState = (state: BlogListState, change: BlogListChange): BlogListState => {
  if ("page" in change) return { ...state, page: change.page };

  const firstPage = { ...state, page: 1 };
  if ("topic" in change) return { ...firstPage, topic: change.topic };
  if ("addTag" in change) {
    return state.tags.includes(change.addTag) ? state : { ...firstPage, tags: [...state.tags, change.addTag] };
  }
  if ("removeTag" in change) return { ...firstPage, tags: state.tags.filter((tag) => tag !== change.removeTag) };
  if ("clearTags" in change) return { ...firstPage, tags: [] };
  if ("sort" in change) return { ...firstPage, sort: change.sort };
  return { ...firstPage, per: change.per };
};
