import { notFound } from "next/navigation";

import { getPost, getPublishedSlugs, type Post } from "@/db/queries/blog";
import type { Locale } from "@/shared/lib/locales";

/**
 * The post for a slug from the URL, or the 404 page. The slug is checked against the cached list of published slugs
 * first, so an arbitrary address reads no post and adds no `"use cache"` entry (the blog list's rule). The route itself
 * still stores its rendered 404 per requested path (`ensureStatic`, see Rendering Strategy). An exact match:
 * `Demo-Post-4` is not `demo-post-4`.
 */
export const loadPost = async (locale: Locale, slug: string): Promise<Post> => {
  const slugs = await getPublishedSlugs();
  if (!slugs.includes(slug)) notFound();

  const post = await getPost(locale, slug);
  if (post === null) notFound();

  return post;
};
