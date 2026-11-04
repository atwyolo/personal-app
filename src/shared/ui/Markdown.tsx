import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";
import ReactMarkdown, { type Components, defaultUrlTransform } from "react-markdown";

import { cn } from "@/shared/lib/utils";

import { isWebHref, Link } from "./Link";

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

const keepPhoneLinks = (url: string): string => (url.startsWith("tel:") ? url : defaultUrlTransform(url));

interface MarkdownProps {
  source: string;
  headingOffset?: number;
  className?: string;
}

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
      <ReactMarkdown components={components} skipHtml urlTransform={keepPhoneLinks}>
        {source}
      </ReactMarkdown>
    </div>
  );
};
