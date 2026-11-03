import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/db/queries/home";
import { serializeJsonLd } from "@/shared/lib/json-ld";
import { siteUrl } from "@/shared/lib/site-url";
import { Post } from "@/widgets/post/Post";

import { loadPost } from "./load-post";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/** One published post, prerendered per locale, with its `BlogPosting` structured data. */
export const PostPage: FC<PostPageProps> = async (props) => {
  const { params } = props;
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const [post, profile] = await Promise.all([loadPost(locale, slug), getProfile(locale)]);

  const url = new URL(`/${locale}/blog/${slug}`, siteUrl).href;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.contentShort,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: profile.name, url: new URL(`/${locale}`, siteUrl).href },
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
    keywords: post.tags,
    inLanguage: locale,
    mainEntityOfPage: url,
  };

  return (
    <main className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Post post={post} author={{ name: profile.name, jobTitle: profile.jobTitle }} />
    </main>
  );
};
