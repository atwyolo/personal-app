import { useCallback, useEffect, useRef } from "react";

/**
 * What a visitor's own scroll starts with. `scroll` itself cannot tell it from the scroll a click started,
 * so these only mark the intent, and the next `scroll` confirms it. A press that moves nothing changes nothing.
 */
const HAND_INPUT_EVENTS = ["wheel", "touchmove", "keydown", "pointerdown"] as const;

interface UseScrollHold {
  /** Holds a choice from now on. The press that made the choice does not count as the visitor's scroll. */
  hold: () => void;
  /** Ends the hold without a scroll, e.g. for a page that came back from the kept routes with its old state. */
  release: () => void;
  isHeld: () => boolean;
}

/** Keeps a chosen section until the visitor scrolls by hand, for links that scroll the page to a section themselves. */
export const useScrollHold = (): UseScrollHold => {
  const heldRef = useRef(false);
  const handInputRef = useRef(false);

  const hold = useCallback(() => {
    heldRef.current = true;
    handInputRef.current = false;
  }, []);

  const release = useCallback(() => {
    heldRef.current = false;
  }, []);

  const isHeld = useCallback(() => heldRef.current, []);

  useEffect(() => {
    const handleScroll = () => {
      if (handInputRef.current) heldRef.current = false;
    };

    const markHandInput = () => {
      handInputRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    for (const type of HAND_INPUT_EVENTS) window.addEventListener(type, markHandInput, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      for (const type of HAND_INPUT_EVENTS) window.removeEventListener(type, markHandInput);
    };
  }, []);

  return { hold, release, isHeld };
};
