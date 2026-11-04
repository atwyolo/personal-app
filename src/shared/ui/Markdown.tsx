import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/shared/lib/utils";

import { isWebHref, Link } from "./Link";

/** Size by the level written in the file (Claude's call, no design exists): 1 and 2 stand out, the rest is body size. */
const headingSize = ["text-xl lg:text-2xl", "text-lg lg:text-xl", "text-base", "text-base", "text-base", "text-base"];

type Level = 1 | 2 | 3 | 4 | 5 | 6;

const heading = (level: Level, offset: number): Components["h1"] => {
  const HeadingTag = `h${Math.min(level + offset, 6)}` as `h${Level}`;

  const MarkdownHeading: FC<{ children?: ReactNode }> = (props) => {
    const { children } = props;

    return <HeadingTag className={cn("font-semibold text-foreground", headingSize[level - 1])}>{children}</HeadingTag>;
  };

  return MarkdownHeading;
};

interface MarkdownProps {
  /** CommonMark from a content file; the loader has already rejected anything outside the allowed set. */
  source: string;
  /**
   * How many levels the text sits below the page's outline: `#` renders as `h{1 + headingOffset}`, so a body never adds
   * a second `h1`. Under an `h2`, pass 2.
   */
  headingOffset?: number;
  /** Type sizes of the block; spacing between its blocks comes from here. */
  className?: string;
}

/**
 * Renders a Markdown body on the server: React elements built from the syntax tree, never `innerHTML`. Raw HTML in the
 * source is dropped (`skipHtml`), a second guard behind the loader. Every block is a direct child of the root, so a page
 * can style one by position (Home enlarges the first paragraph).
 */
export const Markdown: FC<MarkdownProps> = (props) => {
  const { source, headingOffset = 0, className } = props;
  const t = useTranslations("Pages.Common");

  const components: Components = {
    h1: heading(1, headingOffset),
    h2: heading(2, headingOffset),
    h3: heading(3, headingOffset),
    h4: heading(4, headingOffset),
    h5: heading(5, headingOffset),
    h6: heading(6, headingOffset),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => (
      <ul className="flex flex-col gap-2.5 *:flex *:gap-2.5 *:text-foreground-soft *:before:mt-2 *:before:size-2 *:before:shrink-0 *:before:rounded-[2px] *:before:bg-deco lg:*:gap-3">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-2.5 pl-5 *:text-foreground-soft marker:font-mono marker:text-brand">
        {children}
      </ol>
    ),
    a: ({ href = "", children }) => (
      <Link href={href} newTabLabel={isWebHref(href) ? t("newTab") : undefined}>
        {children}
      </Link>
    ),
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-3.5 lg:gap-4", className)}>
      <ReactMarkdown components={components} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
};
