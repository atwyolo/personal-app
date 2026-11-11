import type { FC } from "react";

import { cn } from "@/shared/lib/utils";

interface StatusCodeProps {
  variant: "not-found" | "error";
}

const tile = "relative mx-[.04em] inline-block h-[.74em] w-[.6em] rounded-[.16em] bg-brand shadow-[0_.08em_.16em_-.06em_rgba(0,0,0,.45)]";
const hole = "absolute top-1/2 left-1/2 h-1/2 w-[30%] -translate-1/2 rounded-[.06em] bg-background";
const deco = "absolute -top-[.07em] size-[.13em] rounded-[.03em] bg-deco";

export const StatusCode: FC<StatusCodeProps> = (props) => {
  const { variant } = props;
  const isError = variant === "error";

  return (
    <div
      data-status-code
      data-not-found-code={isError ? undefined : ""}
      aria-hidden="true"
      className="mb-6 flex items-center justify-center gap-[.06em] text-[112px] leading-none font-extrabold tracking-[-0.06em] text-foreground select-none lg:mb-[34px] lg:text-[200px]"
    >
      {isError ? (
        <>
          <span>5</span>
          <span>0</span>
          <span className={cn(tile, "translate-y-[.04em] rotate-8")}>
            <span className={hole} />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 z-2 size-full overflow-visible"
            >
              <path
                d="M58 -2 L50 22 L62 34 L46 52 L58 66 L44 102"
                fill="none"
                stroke="var(--background)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={cn(deco, "-left-[.07em]")} />
          </span>
        </>
      ) : (
        <>
          <span>4</span>
          <span className={cn(tile, "-rotate-6")}>
            <span className={hole} />
            <span className={cn(deco, "-right-[.07em]")} />
          </span>
          <span>4</span>
        </>
      )}
    </div>
  );
};
