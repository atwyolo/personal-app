import type { RefObject } from "react";

import { useHideOnScroll } from "./useHideOnScroll";
import { useIsStuck } from "./useIsStuck";

/** Pixels of scrolling in one direction before the panel folds or unfolds: less is a finger's jitter. */
const FOLD_THRESHOLD_PX = 10;

interface UseFoldingPanelParams {
  /** The sticky panel; its unfolded offset is its `--stick-top` (see `useIsStuck`). */
  ref: RefObject<HTMLElement | null>;
  /** The panel's field has focus: it never folds then, because typing opens the keyboard. */
  focused: boolean;
}

interface UseFoldingPanel {
  stuck: boolean;
  /** Stuck and scrolling down: the page moves the panel's sticky `top` so its field slides under the header. */
  collapsed: boolean;
}

/** A filter panel on phones that sticks under the header and folds its search away while the visitor scrolls down. */
export const useFoldingPanel = (params: UseFoldingPanelParams): UseFoldingPanel => {
  const { ref, focused } = params;
  const { stuck } = useIsStuck({ ref });
  const { hidden } = useHideOnScroll({ threshold: FOLD_THRESHOLD_PX });

  return { stuck, collapsed: stuck && hidden && !focused };
};
