import { getTranslations } from "next-intl/server";
import { type FC, Suspense } from "react";

import { PageHero } from "@/shared/ui/PageHero";
import { BlogList, type BlogSearchParams } from "@/widgets/blog-list/BlogList";
import { BlogListSkeleton } from "@/widgets/blog-list/BlogListSkeleton";

interface BlogPageProps {
  searchParams: BlogSearchParams;
}

/**
 * The blog list: the hero is static; the list depends on the URL, so it streams in behind a skeleton on a first
 * visit. On later changes React keeps the shown list while the new one renders (a transition), so the skeleton
 * never comes back.
 */
export const BlogPage: FC<BlogPageProps> = async (props) => {
  const { searchParams } = props;
  const [t, common] = await Promise.all([getTranslations("BlogPage"), getTranslations("Common")]);

  return (
    <main className="w-full">
      <PageHero backLabel={common("back")} title={t("title")} intro={t("intro")} />
      <Suspense fallback={<BlogListSkeleton />}>
        <BlogList searchParams={searchParams} />
      </Suspense>
    </main>
  );
};
