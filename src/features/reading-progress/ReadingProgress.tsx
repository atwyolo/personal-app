"use client";

import { type FC, type MouseEvent, type ReactNode, useEffect, useRef } from "react";

import { useScrollHold } from "@/shared/lib/useScrollHold";

import { getReadingState } from "./reading-state";

interface ReadingProgressProps {
  className?: string;
  /** Server-rendered: `article[id]` per job, and `data-job="<index>"` on everything that follows a job. */
  children: ReactNode;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Looked up inside the root, because a page left behind stays in the DOM, hidden, with the same ids (`cacheComponents`). */
const getArticles = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("article[id]")];

const getFollowers = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-job]")];

const markActive = (root: HTMLElement, active: number) => {
  for (const element of getFollowers(root)) {
    const isActive = Number(element.dataset.job) === active;

    element.toggleAttribute("data-active", isActive);
    if (element.tagName !== "A") continue;
    if (isActive) element.setAttribute("aria-current", "true");
    else element.removeAttribute("aria-current");
  }
};

const isAtPageEnd = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;

/**
 * Follows the reading on top of server-rendered content, and the page reads the same without it. It writes to the DOM
 * and keeps no state, so a scroll never re-renders React: the marks change at most once a frame.
 *
 * Rows are router links, so the router records the address (`scroll={false}`) and the click scrolls here, smooth only on
 * rows: a site-wide `scroll-behavior` would also animate the browser's own position restore on every history step.
 * A clicked row holds while the page travels, or the smooth scroll would walk the rows in between. A deep link jumps,
 * so the rule alone is right there.
 */
export const ReadingProgress: FC<ReadingProgressProps> = (props) => {
  const { className, children } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const { hold, release, isHeld } = useScrollHold();

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const row = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-job]");
    const article = row && getArticles(root)[Number(row.dataset.job)];
    if (!row || !article) return;

    hold();
    markActive(root, Number(row.dataset.job));
    article.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // The router leaves the focus alone, and a keyboard or screen reader user has to arrive at the job too.
    article.focus({ preventScroll: true });
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const { active, progress } = getReadingState({
        sections: getArticles(root).map((article) => article.getBoundingClientRect()),
        viewportHeight: window.innerHeight,
        atPageEnd: isAtPageEnd(),
      });

      for (const element of getFollowers(root)) {
        element.style.setProperty("--progress", String(progress[Number(element.dataset.job)] ?? 0));
      }
      if (!isHeld()) markActive(root, active);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    // A kept route comes back with its refs: a hold from the last visit says nothing about the page now.
    release();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [release, isHeld]);

  return (
    <div ref={rootRef} className={className} onClick={handleClick}>
      {children}
    </div>
  );
};
