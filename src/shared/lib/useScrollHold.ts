import { useCallback, useEffect, useRef } from "react";

const HAND_INPUT_EVENTS = ["wheel", "touchmove", "keydown", "pointerdown"] as const;

interface UseScrollHold {
  hold: () => void;
  release: () => void;
  isHeld: () => boolean;
}

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
