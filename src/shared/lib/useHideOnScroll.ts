import { useEffect, useState } from "react";

import { type HideState, nextHideState } from "./hide-on-scroll";

interface UseHideOnScrollParams {
  /** Pixels of travel in one direction before the state changes. */
  threshold: number;
}

interface UseHideOnScroll {
  /** True after scrolling down, false after scrolling up. */
  hidden: boolean;
}

/** The window's scroll direction as "hide" or "show", read once per frame. */
export const useHideOnScroll = (params: UseHideOnScrollParams): UseHideOnScroll => {
  const { threshold } = params;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let state: HideState = { hidden: false, lastY: window.scrollY, travel: 0 };
    let frame = 0;

    const measure = () => {
      frame = 0;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      state = nextHideState(state, window.scrollY, maxY, threshold);
      setHidden(state.hidden);
    };
    // `scroll` fires many times per frame on iOS; one measurement per frame is enough.
    const handleScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return { hidden };
};
