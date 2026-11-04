import type { ComponentPropsWithoutRef, FC } from "react";

import { cn } from "@/shared/lib/utils";

interface TileProps extends ComponentPropsWithoutRef<"div"> {
  as?: "div" | "section" | "article";
}

export const Tile: FC<TileProps> = (props) => {
  const { as: Element = "div", className, ...rest } = props;

  return (
    <Element
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-tile border border-card-border bg-card p-4 lg:gap-2.5 lg:rounded-tile-lg lg:p-6",
        className,
      )}
      {...rest}
    />
  );
};
