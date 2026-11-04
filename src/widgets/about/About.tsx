import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { cn } from "@/shared/lib/utils";
import { Link } from "@/shared/ui/Link";
import { Markdown } from "@/shared/ui/Markdown";
import { Tile } from "@/shared/ui/Tile";

interface AboutProps {
  /** Grid placement from the page. */
  className?: string;
}

/**
 * About tile of the first screen: the whole `aboutShort` document on every breakpoint, then a link to the About page.
 * The first paragraph is the lead, which only this block enlarges, so its size lives here and not in Markdown.
 */
export const About: FC<AboutProps> = async (props) => {
  const { className } = props;
  const locale = await getLocale();
  const [{ aboutShort }, t] = await Promise.all([getProfile(locale), getTranslations("Pages.Home.about")]);

  return (
    <Tile as="section" aria-labelledby="about-title" className={cn("gap-3.5 p-5 lg:gap-4 lg:p-9", className)}>
      <h2
        id="about-title"
        className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase lg:text-xs"
      >
        {t("label")}
      </h2>
      <Markdown
        source={aboutShort}
        headingOffset={2}
        className="text-[15px] leading-normal lg:text-base lg:leading-[1.55] [&>p:first-child]:text-[17px] [&>p:first-child]:leading-[1.45] lg:[&>p:first-child]:text-xl"
      />
      <Link href="/about" showArrowIcon className="self-start py-1 text-[15px]">
        {t("readMore")}
      </Link>
    </Tile>
  );
};
