"use client";

import { type FC, type ReactNode, useLayoutEffect, useRef } from "react";

const REVEAL_ROOT_MARGIN = "0px 0px -15% 0px";

interface InterviewRevealProps {
  children: ReactNode;
  className?: string;
}

export const InterviewReveal: FC<InterviewRevealProps> = (props) => {
  const { children, className } = props;
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root || reducedMotion || !window.IntersectionObserver) return;

    const sections = [...root.querySelectorAll("section:not([data-revealed])")];
    const reveal = (section: Element) => section.setAttribute("data-revealed", "");

    const lineObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;

          reveal(entry.target);
          lineObserver.unobserve(entry.target);
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );

    const endObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      sections.forEach(reveal);
      lineObserver.disconnect();
      endObserver.disconnect();
    });

    const targetIndex = sections.findIndex((section) => `#${section.id}` === window.location.hash);
    sections.forEach((section, index) => {
      if (index <= targetIndex || section.getBoundingClientRect().top < window.innerHeight) reveal(section);
      else lineObserver.observe(section);
    });

    const last = sections.at(-1);
    if (last && !last.hasAttribute("data-revealed")) endObserver.observe(last);

    root.setAttribute("data-reveal", "");

    return () => {
      lineObserver.disconnect();
      endObserver.disconnect();
      root.removeAttribute("data-reveal");
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
