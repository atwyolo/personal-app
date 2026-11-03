import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getBlogCatalog, getBlogFacets, getBlogPage } from "@/db/queries/blog";
import { PostCard } from "@/features/post-card/PostCard";
import {
  type BlogListChange,
  buildBlogListHref,
  nextBlogListState,
  PAGE_SIZES,
  parseBlogListQuery,
} from "@/schemas/blog-list";
import { Link } from "@/shared/lib/i18n/navigation";
import { ChipLinks } from "@/shared/ui/ChipLinks";
import { NavigationScope } from "@/shared/ui/NavigationScope";
import { PageSizeSwitch } from "@/shared/ui/PageSizeSwitch";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedLinks } from "@/shared/ui/SegmentedLinks";

import { resolveBlogListState } from "./lib/resolve-state";
import { BlogFilters } from "./ui/BlogFilters";
import { FixAddress } from "./ui/FixAddress";

export type BlogSearchParams = Promise<Record<string, string | string[] | undefined>>;

interface BlogListProps {
  searchParams: BlogSearchParams;
}

/** The list header's id: page and size changes move the view and the focus there. */
const LIST_HEAD_ID = "list-head";
const ALL_TOPICS_KEY = "*";

const sorted = (tags: string[]) => [...tags].sort();

/**
 * The blog list for the state in the URL, rendered on the server. Every control is a link to its state, built here,
 * so the list works before hydration; `NavigationScope` turns their clicks into transitions that block further clicks
 * until the answer has rendered. A URL that cannot be restored completely shows the default state and is replaced.
 */
export const BlogList: FC<BlogListProps> = async (props) => {
  const { searchParams } = props;
  const [query, locale, t] = await Promise.all([searchParams, getLocale(), getTranslations("BlogPage")]);

  const catalog = await getBlogCatalog(locale);
  const { state, restored } = await resolveBlogListState(
    parseBlogListQuery(query),
    catalog,
    async (topic, tags) => (await getBlogFacets(locale, topic, sorted(tags))).matchCount,
  );
  // Sorted for the cache keys only; the URL keeps the order of selection.
  const [facets, posts] = await Promise.all([
    getBlogFacets(locale, state.topic, sorted(state.tags)),
    getBlogPage(locale, { ...state, tags: sorted(state.tags) }),
  ]);

  const href = (change: BlogListChange) => buildBlogListHref(nextBlogListState(state, change));
  const tagHref = (tag: string) => href(state.tags.includes(tag) ? { removeTag: tag } : { addTag: tag });
  const pageCount = Math.max(1, Math.ceil(facets.matchCount / state.per));
  const isFiltered = state.topic !== null || state.tags.length > 0;

  const topicChips = (
    <ChipLinks
      label={t("topic")}
      items={[
        { key: ALL_TOPICS_KEY, label: t("all"), count: facets.allCount, href: href({ topic: null }), current: state.topic === null },
        ...catalog.topics.map((topic) => ({
          key: topic.key,
          label: topic.label,
          count: facets.topicCounts[topic.key] ?? 0,
          href: href({ topic: topic.key }),
          current: state.topic === topic.key,
        })),
      ]}
      className="max-lg:w-max max-lg:flex-nowrap"
    />
  );

  const selectedTags =
    state.tags.length === 0 ? null : (
      <div className="flex flex-wrap items-center gap-1.5">
        <ul aria-label={t("selectedTags")} className="flex flex-wrap gap-1.5">
          {state.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={href({ removeTag: tag })}
                aria-label={t("removeTag", { tag })}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand pr-1.5 pl-3 font-mono text-xs text-primary-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {tag}
                <span aria-hidden className="grid size-5 place-items-center rounded-full bg-primary-foreground/20">
                  ×
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={href({ clearTags: true })}
          className="ml-1 font-mono text-xs text-brand underline decoration-deco decoration-2 underline-offset-4"
        >
          {t("reset")}
        </Link>
      </div>
    );

  const suggestions = Object.entries(facets.tagCounts)
    .filter(([, count]) => count > 0)
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([tag, count]) => ({ tag, count }));

  return (
    // `scroll-margin-top` is the site header: a page change puts the panel in its own sticky place, the list under it.
    <NavigationScope
      focusFallback={LIST_HEAD_ID}
      className="scroll-mt-16 px-3.5 pb-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:scroll-mt-[93px] lg:items-start lg:gap-8 lg:px-16 lg:pb-14"
    >
      {!restored && <FixAddress />}
      <BlogFilters
        state={state}
        suggestions={suggestions}
        topicsLabel={t("topic")}
        selectedLabel={t("tags")}
        topics={topicChips}
        selected={selectedTags}
      />
      {/* Dimmed while a change is loading: the old list stays until the new one replaces it (owner's rule). */}
      <div className="mt-4 flex min-w-0 flex-col gap-4 transition-opacity in-data-pending:opacity-55 lg:mt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p
            id={LIST_HEAD_ID}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase outline-hidden lg:text-xs"
          >
            {isFiltered
              ? t("countFiltered", { shown: facets.matchCount, total: catalog.total })
              : t("countAll", { total: catalog.total })}
          </p>
          <SegmentedLinks
            label={t("sortBy")}
            items={[
              { key: "newest", label: t("newest"), href: href({ sort: "newest" }), current: state.sort === "newest" },
              { key: "oldest", label: t("oldest"), href: href({ sort: "oldest" }), current: state.sort === "oldest" },
            ]}
          />
        </div>
        {posts.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} layout="list" tagHref={tagHref} selectedTags={state.tags} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-card-border p-6">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-[15px] text-foreground-soft">{t("emptyHint")}</p>
            <Link
              href="/blog"
              className="mt-1 font-mono text-xs text-brand underline decoration-deco decoration-2 underline-offset-4"
            >
              {t("resetFilters")}
            </Link>
          </div>
        )}
        {(pageCount > 1 || facets.matchCount > PAGE_SIZES[0]) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Pagination
              label={t("pagination")}
              page={state.page}
              pageCount={pageCount}
              hrefFor={(page) => href({ page })}
              previousLabel={t("previousPage")}
              nextLabel={t("nextPage")}
              pageLabel={(page) => t("pageLabel", { page })}
              scrollTarget={LIST_HEAD_ID}
            />
            {facets.matchCount > PAGE_SIZES[0] && (
              <PageSizeSwitch
                label={t("perPage")}
                sizes={PAGE_SIZES}
                current={state.per}
                hrefFor={(per) => href({ per: per as (typeof PAGE_SIZES)[number] })}
                scrollTarget={LIST_HEAD_ID}
                className="sm:ml-auto"
              />
            )}
          </div>
        )}
      </div>
    </NavigationScope>
  );
};
