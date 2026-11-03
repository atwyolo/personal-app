"use client";

import { TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import { type BlogListState, buildBlogListHref, nextBlogListState } from "@/schemas/blog-list";
import { Combobox } from "@/shared/ui/Combobox";
import { useNavigationScope } from "@/shared/ui/NavigationScope";

interface TagSearchProps {
  state: BlogListState;
  /** Tags with their faceted counts, only those above 0 (the server filters). */
  suggestions: { tag: string; count: number }[];
  onFocusChange?: (focused: boolean) => void;
}

/**
 * The blog list's tag search: typing filters the tags that came with the page (no request), picking one adds it to
 * the filter through a new URL. Already selected tags are not suggested. Picks wait while a change is loading.
 */
export const TagSearch: FC<TagSearchProps> = (props) => {
  const { state, suggestions, onFocusChange } = props;
  const t = useTranslations("BlogPage");
  const { pending, navigate } = useNavigationScope();

  const items = suggestions
    .filter(({ tag }) => !state.tags.includes(tag))
    .map(({ tag, count }) => ({ value: tag, label: tag, hint: t("tagPosts", { count }) }));

  return (
    <Combobox
      label={t("searchTags")}
      clearLabel={t("clearText")}
      emptyText={t("noMatchingTags")}
      suggestions={items}
      pickable={!pending}
      onPick={(tag) => navigate(buildBlogListHref(nextBlogListState(state, { addTag: tag })))}
      onFocusChange={onFocusChange}
      icon={<TagIcon aria-hidden className="size-[18px]" />}
    />
  );
};
