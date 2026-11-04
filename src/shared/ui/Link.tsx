import type { ComponentPropsWithoutRef, FC } from "react";

import { Link as RouterLink } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

// A scheme (https:, mailto:, tel:) or a protocol-relative URL: the address is not a page of this site.
const EXTERNAL_HREF = /^([a-z][a-z\d+.-]*:|\/\/)/i;
const WEB_HREF = /^(https?:)?\/\//i;

/** A web address of another site: `Link` opens it in a new tab. */
export const isWebHref = (href: string): boolean => WEB_HREF.test(href);

interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  /** Adds a decorative arrow after the text; it stays out of the accessible name. */
  showArrowIcon?: boolean;
  /**
   * Opens a page of the site in a new tab and says so: the label is visually hidden text after the children (WCAG
   * technique G201), and the arrow becomes ↗. `noopener` keeps the new tab from reaching this one through `window.opener`.
   */
  newTabLabel?: string;
}

/**
 * The site's text link: brand color with a yellow underline, in the font size of its surroundings.
 * Pages of the site go through the router, which adds the locale and navigates without a reload; anything else is
 * a plain anchor, and a web address opens in a new tab so the visitor keeps the site open. `target` and `rel` may
 * be overridden, `className` sets the size and placement.
 */
export const Link: FC<LinkProps> = (props) => {
  const { href, showArrowIcon, newTabLabel, className, children, ...rest } = props;
  const classes = cn(
    "rounded-sm font-semibold text-brand underline decoration-deco decoration-2 underline-offset-[5px] transition-colors hover:decoration-brand",
    className,
  );
  const content = (
    <>
      {children}
      {/* The space outside the hidden text: inside it, the accessible name would read "Read more(opens…". */}
      {newTabLabel && (
        <>
          {" "}
          <span className="sr-only">{newTabLabel}</span>
        </>
      )}
      {showArrowIcon && <span aria-hidden>{newTabLabel ? " ↗" : " →"}</span>}
    </>
  );

  if (!EXTERNAL_HREF.test(href)) {
    // No prefetch for a new tab: next/link prefetches whatever its `target`, and the data would land in this tab's
    // router, which never shows that page.
    const target = newTabLabel ? { target: "_blank", rel: "noopener", prefetch: false } : undefined;

    return (
      <RouterLink href={href} className={classes} {...target} {...rest}>
        {content}
      </RouterLink>
    );
  }

  const newTab = isWebHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : undefined;

  return (
    <a href={href} className={classes} {...newTab} {...rest}>
      {content}
    </a>
  );
};
