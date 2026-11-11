import { ChevronLeftIcon } from "lucide-react";
import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";

interface BackLinkProps {
  label: string;
  href?: string;
}

export const BackLink: FC<BackLinkProps> = (props) => {
  const { label, href = "/" } = props;

  return (
    <Link
      href={href}
      className="group mb-[30px] flex min-h-8 w-fit items-center gap-1.5 rounded-sm text-[15px] font-semibold text-brand"
    >
      <ChevronLeftIcon
        aria-hidden
        className="size-4 transition-transform group-hover:-translate-x-[3px] motion-reduce:transition-none"
      />
      <span className="underline decoration-deco decoration-2 underline-offset-[5px]">{label}</span>
    </Link>
  );
};
