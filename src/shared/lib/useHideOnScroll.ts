import { useEffect, useState } from "react";

import { type HideState, nextHideState } from "./hide-on-scroll";

interface UseHideOnScrollParams {
  threshold: number;
}

interface UseHideOnScroll {
  hidden: boolean;
}

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
