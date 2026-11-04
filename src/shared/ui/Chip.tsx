import type { FC, ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
}

/** Mono pill with colored text and no fill (same in both themes): skill tags in the hero and the experience. */
export const Chip: FC<ChipProps> = (props) => {
  const { children } = props;

  return (
    <span className="inline-block rounded-full border border-card-border px-2.5 py-[7px] font-mono text-xs leading-none font-medium text-brand lg:px-3 lg:py-2 lg:text-[13px]">
      {children}
    </span>
  );
};
