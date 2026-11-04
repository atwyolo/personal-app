import type { FC, ReactNode } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/shadcn/ui/button";

import { type ButtonLookProps, getButtonClasses } from "./Button";

interface ButtonLinkProps extends ButtonLookProps {
  href: string;
  children: ReactNode;
}

export const ButtonLink: FC<ButtonLinkProps> = (props) => {
  const { href, children, ...look } = props;

  return (
    <Link href={href} className={cn(buttonVariants({ variant: "default", className: getButtonClasses(look) }))}>
      {children}
    </Link>
  );
};
