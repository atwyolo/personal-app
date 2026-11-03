import { getPublishedSlugs } from "@/db/queries/blog";

/** A slug that no post can have: it only gives the build a param to validate the route with. */
export const PLACEHOLDER_SLUG = "__no-post__";

/**
 * Every published slug; the `[locale]` layout adds the locales. Under Cache Components an empty list fails the build,
 * so with no published post the route is validated with a placeholder, which renders the 404 page.
 */
export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  const slugs = await getPublishedSlugs();

  return (slugs.length > 0 ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
};
