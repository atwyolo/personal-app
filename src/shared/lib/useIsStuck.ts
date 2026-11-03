import { type RefObject, useEffect, useState } from "react";

interface UseIsStuckParams {
  ref: RefObject<HTMLElement | null>;
}

interface UseIsStuck {
  stuck: boolean;
}

/**
 * Whether a `position: sticky` element sits at its sticky offset now, read once per frame of scrolling or resizing.
 * The offset comes from the element's `--stick-top` custom property (in px), or its computed `top` without one.
 * An element whose `top` transitions must set `--stick-top`: Safari reports a transitioning `top` at its end value,
 * so a panel folding from 64 px to 2 px looked unstuck halfway, unfolded, looked stuck again, and looped
 * (seen in the iOS simulator on 2026-11-03). A custom property never transitions.
 */
export const useIsStuck = (params: UseIsStuckParams): UseIsStuck => {
  const { ref } = params;
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;

      const style = getComputedStyle(element);
      const offset = Number.parseFloat(style.getPropertyValue("--stick-top")) || Number.parseFloat(style.top);
      // Half a pixel of slack for subpixel positions; `NaN` (`top: auto`) means not sticky at all.
      setStuck(element.getBoundingClientRect().top <= offset + 0.5);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [ref]);

  return { stuck };
};
