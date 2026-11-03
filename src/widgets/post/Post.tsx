import { getFormatter, getTranslations } from "next-intl/server";
import type { FC } from "react";

import type { Post as PostData } from "@/db/queries/blog";
import { buildBlogListHref, DEFAULT_BLOG_LIST_STATE } from "@/schemas/blog-list";
import { Link } from "@/shared/lib/i18n/navigation";
import { getInitials } from "@/shared/lib/initials";
import { BackLink } from "@/shared/ui/BackLink";
import { Chip } from "@/shared/ui/Chip";
import { Image } from "@/shared/ui/Image";
import { RichText } from "@/shared/ui/RichText";

interface PostProps {
  post: PostData;
  author: { name: string; jobTitle: string };
}

/**
 * The article: Back to the list, the header (title, topic and date, tags), the cover when there is one, the card text
 * as the lead, the body, and the author. The topic and the tags are deep links into the blog list, in the same tab.
 * The column is 760 px wide; the cover is 40 px wider on each side from `lg`.
 */
export const Post: FC<PostProps> = async (props) => {
  const { post, author } = props;
  const { title, topic, topicKey, publishedAt, tags, coverUrl, contentShort, contentFull } = post;
  const [t, common, format] = await Promise.all([getTranslations("Post"), getTranslations("Common"), getFormatter()]);

  return (
    <article className="mx-auto w-full max-w-[760px] px-[18px] pt-[18px] pb-12 [overflow-wrap:anywhere] lg:px-10 lg:pt-7 lg:pb-[72px]">
      <BackLink label={common("back")} href="/blog" />
      <header className="flex flex-col gap-3.5">
        <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-0.035em] lg:text-[44px]">{title}</h1>
        <p className="flex flex-wrap items-center gap-3">
          <Link
            href={buildBlogListHref({ ...DEFAULT_BLOG_LIST_STATE, topic: topicKey })}
            className="rounded-[6px] bg-brand/14 px-[9px] py-1.5 font-mono text-[11px] leading-none font-semibold tracking-[0.08em] text-brand uppercase outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {topic}
          </Link>
          <time dateTime={publishedAt} className="font-mono text-[13px] text-muted-foreground">
            {format.dateTime(new Date(publishedAt), { year: "numeric", month: "short", day: "numeric" })}
          </time>
        </p>
        {tags.length > 0 && (
          <ul aria-label={t("tags")} className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip href={buildBlogListHref({ ...DEFAULT_BLOG_LIST_STATE, tags: [tag] })}>{tag}</Chip>
              </li>
            ))}
          </ul>
        )}
      </header>
      {coverUrl && (
        <figure className="relative mt-7 aspect-video overflow-hidden rounded-[18px] lg:-mx-10 lg:rounded-3xl">
          <Image src={coverUrl} alt={title} sizes="(min-width: 1024px) 840px, calc(100vw - 36px)" className="object-cover" priority />
        </figure>
      )}
      <p className="mt-[26px] text-[18.5px] leading-[1.6] text-foreground lg:mt-[34px] lg:text-[21px]">{contentShort}</p>
      {contentFull && <RichText doc={contentFull} size="post" className="mt-[22px]" />}
      <hr className="mt-11 mb-[22px] border-card-border" />
      <div data-author="" className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full border border-card-border bg-card font-mono text-sm font-semibold text-brand"
        >
          {getInitials(author.name)}
        </span>
        <div className="flex flex-col">
          <span className="text-base font-semibold">{author.name}</span>
          <span className="text-sm text-muted-foreground">{author.jobTitle}</span>
        </div>
      </div>
    </article>
  );
};
