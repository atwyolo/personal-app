import type { ComponentPropsWithoutRef, FC } from "react";

import { Link as RouterLink } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

const EXTERNAL_HREF = /^([a-z][a-z\d+.-]*:|\/\/)/i;
const WEB_HREF = /^(https?:)?\/\//i;

export const isWebHref = (href: string): boolean => WEB_HREF.test(href);

interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  showArrowIcon?: boolean;
  newTabLabel?: string;
}

export const Link: FC<LinkProps> = (props) => {
  const { href, showArrowIcon, newTabLabel, className, children, ...rest } = props;
  const classes = cn(
    "rounded-sm font-semibold text-brand underline decoration-deco decoration-2 underline-offset-[5px] transition-colors hover:decoration-brand",
    className,
  );
  const content = (
    <>
      {children}
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
