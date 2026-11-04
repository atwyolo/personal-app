"use client";

import type { FC } from "react";

import { Link, usePathname } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

interface NavLinkProps {
  href: string;
  children: string;
  className?: string;
}

const isActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export const NavLink: FC<NavLinkProps> = (props) => {
  const { href, children, className } = props;
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-label={children}
      className={cn(
        "transition-colors hover:text-brand",
        active && "font-semibold text-brand underline decoration-deco decoration-[3px] underline-offset-8",
        className,
      )}
    >
      {children}
    </Link>
  );
};
