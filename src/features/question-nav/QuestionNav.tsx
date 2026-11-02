"use client";

import { type FC, type MouseEvent, useEffect, useRef, useState } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { cn } from "@/shared/lib/utils";

import { getActiveSection } from "./active-section";

interface QuestionNavProps {
  label: string;
  items: { slug: string; linkText: string }[];
}

/**
 * What a visitor's own scroll starts with. `scroll` itself cannot tell it from the scroll a chip started,
 * so these only mark the intent, and the next `scroll` confirms it. A press that moves nothing changes nothing.
 */
const HAND_INPUT_EVENTS = ["wheel", "touchmove", "keydown", "pointerdown"] as const;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The sticky row of question chips. It must sit next to its sections inside one parent: sections are looked up there,
 * because a page left behind stays in the DOM, hidden, with the same ids (`cacheComponents`).
 *
 * A chip is a real link, so it works without JavaScript. With it, the router only records the address (`scroll={false}`)
 * and the click scrolls: smooth scrolling stays on chips, where a site-wide `scroll-behavior` would also animate the
 * browser's own position restore on every history step. `replace` keeps chips out of the history, so the back button
 * leaves the page instead of walking the chips.
 */
export const QuestionNav: FC<QuestionNavProps> = (props) => {
  const { label, items } = props;
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  // A chosen section may be unable to rise to the top, so the choice holds until the visitor scrolls by hand.
  const heldRef = useRef(false);
  const handInputRef = useRef(false);

  const getSections = () => [...(navRef.current?.parentElement?.querySelectorAll<HTMLElement>("section[id]") ?? [])];

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    heldRef.current = true;
    // The press on this chip was hand input too, and the scroll it starts must not count as the visitor's.
    handInputRef.current = false;
    setActive(items.findIndex((item) => item.slug === slug));

    const section = getSections().find((item) => item.id === slug);
    section?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // The router leaves the focus alone, and a keyboard or screen reader user has to arrive at the section too.
    section?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const sections = getSections();
    let frame = 0;

    const update = () => {
      frame = 0;
      if (heldRef.current) return;

      setActive(
        getActiveSection({
          sectionTops: sections.map((section) => section.getBoundingClientRect().top),
          edge: navRef.current?.getBoundingClientRect().bottom ?? 0,
        }),
      );
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    const handleScroll = () => {
      if (handInputRef.current) heldRef.current = false;
      schedule();
    };

    const markHandInput = () => {
      handInputRef.current = true;
    };

    const target = sections.findIndex((section) => `#${section.id}` === window.location.hash);
    if (target >= 0) {
      heldRef.current = true;
      setActive(target);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    for (const type of HAND_INPUT_EVENTS) window.addEventListener(type, markHandInput, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", schedule);
      for (const type of HAND_INPUT_EVENTS) window.removeEventListener(type, markHandInput);
    };
  }, []);

  // The row scrolls by itself: `scrollIntoView` would also move the page, against the scroll that changed the chip.
  useEffect(() => {
    const row = navRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !chip) return;

    row.scrollTo({
      left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="sticky top-16 z-[5] flex gap-1.5 overflow-x-auto border-b border-card-border bg-background px-3.5 py-2.5 [scrollbar-width:none] lg:top-[72px] lg:px-12 lg:py-3"
    >
      {items.map((item, index) => (
        <Link
          key={item.slug}
          href={`#${item.slug}`}
          replace
          scroll={false}
          onClick={(event) => handleClick(event, item.slug)}
          aria-current={index === active ? "true" : undefined}
          className={cn(
            "shrink-0 rounded-full border px-3 py-2 font-mono text-xs leading-none font-medium transition-colors",
            index === active
              ? "border-foreground bg-foreground text-background"
              : "border-card-border text-foreground-soft",
          )}
        >
          {item.linkText}
        </Link>
      ))}
    </nav>
  );
};
