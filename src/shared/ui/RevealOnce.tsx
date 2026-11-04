"use client";

import { type FC, useLayoutEffect } from "react";

let played = false;

const markRevealed = () => {
  document.documentElement.dataset.revealed = "";
};

export const RevealOnce: FC = () => {
  useLayoutEffect(() => {
    if (played) {
      markRevealed();
      return;
    }

    const wipes = document.getAnimations().filter((animation) => (animation as CSSAnimation).animationName === "wipe");

    void Promise.allSettled(wipes.map((animation) => animation.finished)).then(() => {
      played = true;
      markRevealed();
    });
  }, []);

  return null;
};
