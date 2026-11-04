"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, type FC, type ReactNode, useCallback, useRef, useSyncExternalStore } from "react";

import { getCarouselIndex } from "@/shared/lib/carousel-index";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";

/** `gap-3` of the track. */
const GAP = 12;

interface CarouselProps {
  /** Names the carousel for a screen reader, usually the section title. */
  label: string;
  /** Columns from `lg`, e.g. `lg:grid-cols-4`. Never horizontal padding: a slide must be as wide as the track. */
  className?: string;
  /** One slide per child, rendered on the server. */
  children: ReactNode;
}

/**
 * A CSS scroll-snap row below `lg`, a grid from `lg`, on one DOM: the markup never depends on the screen width.
 * The position has one source, the scroll offset, read as an external store: the track scrolls before hydration, so
 * local state could start out wrong. Arrows only scroll, so a swipe and a click report the same way, and a smooth
 * scroll does not make the counter jump. The one thing kept aside is the slide to return to when the width changes.
 * `role="group"`, because the section around it is already a region.
 * The arrows use `aria-disabled`: a real `disabled` would drop the keyboard focus at the end of the row.
 */
export const Carousel: FC<CarouselProps> = (props) => {
  const { label, className, children } = props;
  const t = useTranslations("Pages.Common.Carousel");
  const trackRef = useRef<HTMLDivElement>(null);

  const slides = Children.toArray(children);
  const total = slides.length;
  const last = total - 1;

  const getIndex = useCallback(() => {
    const track = trackRef.current;

    return track ? getCarouselIndex(track.scrollLeft, track.clientWidth, GAP, total) : 0;
  }, [total]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const track = trackRef.current;
      if (!track) return () => {};

      let width = track.clientWidth;
      let slide = getIndex();

      const onScroll = () => {
        // A new width can clamp the offset before the observer runs: that scroll is not a move to another slide.
        if (track.clientWidth !== width) return;

        slide = getIndex();
        onChange();
      };

      // iOS Safari keeps the old offset after a rotation, so the track would show parts of two slides.
      const observer = new ResizeObserver(() => {
        if (track.clientWidth === width) return;

        width = track.clientWidth;
        const left = slide * (width + GAP);

        // Not on an offset iOS Safari has just clamped to this place: the call throws the track back past its end.
        if (Math.abs(track.scrollLeft - left) >= 2) track.scrollTo({ left, behavior: "instant" });
      });

      track.addEventListener("scroll", onScroll, { passive: true });
      observer.observe(track);

      return () => {
        track.removeEventListener("scroll", onScroll);
        observer.disconnect();
      };
    },
    [getIndex],
  );

  const index = useSyncExternalStore(subscribe, getIndex, () => 0);

  const scrollToSlide = (target: number) => {
    const track = trackRef.current;
    if (!track || target < 0 || target > last) return;

    track.scrollTo({ left: target * (track.clientWidth + GAP) });
  };

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-3">
      {total > 1 && (
        <div className="flex items-center justify-between px-0.5 lg:hidden">
          <span aria-live="polite" className="font-mono text-[11px] font-semibold tracking-[0.08em] text-brand">
            {t("position", { current: index + 1, total })}
          </span>
          <div className="flex gap-2">
            <Button
              tone="outline"
              shape="circle"
              aria-label={t("previous")}
              aria-disabled={index === 0}
              onClick={() => scrollToSlide(index - 1)}
            >
              <ChevronLeftIcon aria-hidden />
            </Button>
            <Button
              tone="outline"
              shape="circle"
              aria-label={t("next")}
              aria-disabled={index === last}
              onClick={() => scrollToSlide(index + 1)}
            >
              <ChevronRightIcon aria-hidden />
            </Button>
          </div>
        </div>
      )}
      <div
        ref={trackRef}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto lg:grid lg:snap-none lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slide", { current: slideIndex + 1, total })}
            className="grid shrink-0 basis-full grid-cols-1 snap-start"
          >
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
};
