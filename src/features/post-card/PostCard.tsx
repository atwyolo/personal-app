import { useFormatter, useTranslations } from "next-intl";
import type { FC } from "react";

import type { PostPreview } from "@/db/queries/home";
import { Link as RouterLink } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/Chip";
import { Image } from "@/shared/ui/Image";
import { Link } from "@/shared/ui/Link";
import { Tile } from "@/shared/ui/Tile";

interface PostCardProps {
  post: PostPreview;
  /** The latest post: a larger title and a cover, on top below `lg`, on the left from `lg`. */
  featured?: boolean;
  /** `"list"`: the blog list's card, always with its cover and an `h2` title. Home keeps `"home"`. */
  layout?: "home" | "list";
  /** Makes each tag a link to this address (a locale-less href): the blog list toggles the tag there. */
  tagHref?: (tag: string) => string;
  /** Tags of the current filter, filled with `brand`. Only with `tagHref`. */
  selectedTags?: string[];
  className?: string;
}

/**
 * One post: topic, date, title, short text, tags. Synchronous, so Vitest can render it.
 * The cover's box is 220px wide from `lg` but at least 240px tall, so `object-cover` scales a landscape file by the
 * height: `sizes` asks for twice the box width.
 */
export const PostCard: FC<PostCardProps> = (props) => {
  const { post, featured, layout = "home", tagHref, selectedTags = [], className } = props;
  const { slug, publishedAt, coverUrl, topic, title, contentShort, tags } = post;
  const t = useTranslations("Home.blog");
  const format = useFormatter();
  const isList = layout === "list";
  const Heading = isList ? "h2" : "h3";

  return (
    <Tile
      as="article"
      className={cn(
        isList
          ? // The list card of the handoff: the cover 140 px on top on phones, a `220px | 1fr` row from `lg`.
            "gap-3 rounded-[20px] p-3 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:rounded-3xl lg:p-4"
          : featured
            ? "gap-2.5 p-3 lg:flex-row lg:gap-5 lg:p-3.5"
            : "p-4.5 lg:p-5",
        className,
      )}
    >
      {isList && (
        <div className="relative h-35 shrink-0 lg:h-auto lg:min-h-50">
          <Image
            src={coverUrl}
            alt={title}
            sizes="(min-width: 1024px) 440px, calc(100vw - 52px)"
            className="object-cover"
            framed
          />
        </div>
      )}
      {featured && !isList && (
        <div className="relative h-37.5 shrink-0 lg:h-auto lg:min-h-60 lg:w-55">
          <Image
            src={coverUrl}
            alt={title}
            sizes="(min-width: 1024px) 440px, (min-width: 720px) 662px, calc(100vw - 58px)"
            className="object-cover"
            framed
          />
        </div>
      )}
      <div
        className={cn(
          "flex min-w-0 grow flex-col gap-2 lg:gap-2.5",
          isList ? "px-1 pb-1 lg:px-0 lg:py-1.5 lg:pr-2" : featured && "px-1 pt-1 pb-0.5 lg:pt-2 lg:pr-2 lg:pb-1.5 lg:pl-0",
        )}
      >
        <p className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-[6px] bg-brand/14 px-2 py-[5px] font-mono text-[11px] leading-none font-semibold tracking-[0.08em] text-brand uppercase">
            {topic}
          </span>
          <time
            dateTime={publishedAt}
            className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase lg:text-xs"
          >
            {format.dateTime(new Date(publishedAt), { year: "numeric", month: "short", day: "numeric" })}
          </time>
        </p>
        <Heading
          className={cn(
            "font-bold",
            // `leading` after `text`: `cn` treats a later font size as overriding the line height and drops it.
            featured || isList
              ? "text-[19px] leading-[1.3] lg:text-[22px] lg:leading-tight lg:tracking-[-0.01em]"
              : "text-[17px] leading-[1.3] lg:text-lg",
          )}
        >
          {/* In the list the title is the card's link with a meaningful name; "Read more" repeats it, as designed. */}
          {isList ? (
            <RouterLink
              href={`/blog/${slug}`}
              className="rounded-sm outline-hidden hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {title}
            </RouterLink>
          ) : (
            title
          )}
        </Heading>
        <p className="text-[15px] leading-[1.55] whitespace-pre-line text-foreground-soft">{contentShort}</p>
        {tags.length > 0 && (
          <ul className="mt-0.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip href={tagHref?.(tag)} selected={selectedTags.includes(tag)}>
                  {tag}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/blog/${slug}`} showArrowIcon className="mt-auto self-start py-1 text-[15px]">
          {t("readMore")}
        </Link>
      </div>
    </Tile>
  );
};
