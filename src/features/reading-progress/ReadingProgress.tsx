"use client";

import { type FC, type MouseEvent, type ReactNode, useEffect, useRef } from "react";

import { useScrollHold } from "@/shared/lib/useScrollHold";

import { getReadingState } from "./reading-state";

interface ReadingProgressProps {
  className?: string;
  children: ReactNode;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
