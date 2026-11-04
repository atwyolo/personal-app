import { ArrowUpRightIcon } from "lucide-react";
import type { FC, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

const tones = {
  channel: "border-card-border bg-card text-foreground transition-colors duration-200 hover:border-brand",
  cv: "border-primary bg-primary text-primary-foreground hover:brightness-95",
} as const;

interface ContactLinkProps {
  href: string;
  label: string;
  title?: string;
  tone: keyof typeof tones;
  external?: boolean;
  mark: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const ContactLink: FC<ContactLinkProps> = (props) => {
  const { href, label, title, tone, external, mark, className, children } = props;
  const { trailing = <ArrowUpRightIcon aria-hidden className="size-[18px] shrink-0 text-brand" /> } = props;

  return (
    <a
      href={href}
      title={title}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "flex min-h-14 min-w-0 items-center gap-3 rounded-[16px] border pr-4 pl-2.5 text-[17px] font-bold tracking-[-0.01em]",
        tones[tone],
        className,
      )}
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center">{mark}</span>
      <span className="min-w-0 grow [overflow-wrap:anywhere]">{children}</span>{" "}
      {trailing}
    </a>
  );
};
