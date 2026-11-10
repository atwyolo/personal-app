"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, type FC, type ReactNode, useCallback, useRef, useSyncExternalStore } from "react";

import { getCarouselIndex } from "@/shared/lib/carousel-index";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";

const GAP = 12;

interface CarouselProps {
  label: string;
  className?: string;
  children: ReactNode;
}

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
        if (track.clientWidth !== width) return;

        slide = getIndex();
        onChange();
      };

      const observer = new ResizeObserver(() => {
        if (track.clientWidth === width) return;

        width = track.clientWidth;
        const left = slide * (width + GAP);

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
    <div role="group" aria-roledescription={t("roleCarousel")} aria-label={label} className="flex flex-col gap-3">
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
            aria-roledescription={t("roleSlide")}
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
