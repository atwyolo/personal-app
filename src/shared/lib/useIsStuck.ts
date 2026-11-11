import { type RefObject, useEffect, useState } from "react";

interface UseIsStuckParams {
  ref: RefObject<HTMLElement | null>;
}

interface UseIsStuck {
  stuck: boolean;
}

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
