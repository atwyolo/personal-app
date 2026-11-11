import type { FC, ReactNode, Ref } from "react";

import { cn } from "@/shared/lib/utils";

interface StatusPageProps {
  code: ReactNode;
  label: string;
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
  text: string;
  detail?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const StatusPage: FC<StatusPageProps> = (props) => {
  const { code, label, title, titleRef, text, detail, className, children } = props;

  return (
    <main
      className={cn(
        "relative isolate flex grow flex-col items-center justify-center overflow-hidden px-5 pt-7 pb-10 text-center lg:px-10 lg:pt-10 lg:pb-14",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(var(--card-border)_1px,transparent_1px),linear-gradient(90deg,var(--card-border)_1px,transparent_1px)] bg-size-[40px_40px] bg-center opacity-35 [mask-image:radial-gradient(circle_at_50%_42%,#000_0,transparent_62%)] lg:bg-size-[64px_64px]"
      />
      {code}
      <p className="mb-3.5 font-mono text-xs leading-none font-medium tracking-[0.12em] text-brand uppercase">{label}</p>
      <h1
        ref={titleRef}
        tabIndex={titleRef ? -1 : undefined}
        className="max-w-[620px] text-[27px] leading-[1.1] font-bold tracking-[-0.03em] text-balance outline-none lg:text-[40px]"
      >
        {title}
      </h1>
      <p className="mt-3.5 max-w-[480px] text-[15.5px] leading-[1.55] text-pretty text-foreground-soft lg:text-[17px]">
        {text}
      </p>
      {detail}
      {children}
    </main>
  );
};
