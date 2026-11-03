import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getSiteMeta } from "@/db/queries/meta";
import { getLocaleAlternates } from "@/shared/lib/i18n/alternates";
import { buildPageMetadata } from "@/shared/lib/metadata";

import { loadPost } from "./load-post";

interface PostMetadataProps {
  params: Promise<{ slug: string }>;
}

/**
 * A post's metadata is the post: no `meta_pages` row. The title is "<post title> — <site name>", as the other pages'
 * stored titles, the description is the card text, the preview image is the cover or the site's placeholder.
 */
export const generateMetadata = async (props: PostMetadataProps): Promise<Metadata> => {
  const { params } = props;
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const [post, site] = await Promise.all([loadPost(locale, slug), getSiteMeta(locale)]);

  return buildPageMetadata({
    page: { title: `${post.title} — ${site.siteName}`, description: post.contentShort, ogImageUrl: post.coverUrl },
    site,
    locale,
    alternates: getLocaleAlternates(locale, `/blog/${slug}`),
    type: "article",
  });
};
