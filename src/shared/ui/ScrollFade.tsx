"use client";

import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

interface ScrollFadeProps {
  children: ReactNode;
  /** Layout only. */
  className?: string;
}

interface Edges {
  start: boolean;
  end: boolean;
}

/**
 * A row that scrolls sideways below `lg`, with a fade at each edge that still has content beyond it: the sign that
 * the row goes on. From `lg` the content lays out as it likes (the aside wraps its chips) and nothing fades.
 * `data-fade-start` / `data-fade-end` mark the edges for the mask and for tests.
 */
export const ScrollFade: FC<ScrollFadeProps> = (props) => {
  const { children, className } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    // One pixel of slack: zoom and subpixel widths leave fractions at the end.
    setEdges({ start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [measure]);

  return (
    <div
      ref={ref}
      onScroll={measure}
      data-scroll-fade=""
      data-fade-start={edges.start ? "" : undefined}
      data-fade-end={edges.end ? "" : undefined}
      className={cn(
        "max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden",
        // The mask hides 32 px at a faded edge; both custom properties default to "no fade".
        "max-lg:[--fade-start:0px] max-lg:[--fade-end:0px] max-lg:data-fade-start:[--fade-start:32px] max-lg:data-fade-end:[--fade-end:32px]",
        "max-lg:[mask-image:linear-gradient(to_right,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
        className,
      )}
    >
      {children}
    </div>
  );
};
