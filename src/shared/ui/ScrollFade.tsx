"use client";

import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
}

interface Edges {
  start: boolean;
  end: boolean;
}

export const ScrollFade: FC<ScrollFadeProps> = (props) => {
  const { children, className } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
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
        "max-lg:[--fade-start:0px] max-lg:[--fade-end:0px] max-lg:data-fade-start:[--fade-start:32px] max-lg:data-fade-end:[--fade-end:32px]",
        "max-lg:[mask-image:linear-gradient(to_right,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
        className,
      )}
    >
      {children}
    </div>
  );
};
