import type { RefObject } from "react";

import { useHideOnScroll } from "./useHideOnScroll";
import { useIsStuck } from "./useIsStuck";

const FOLD_THRESHOLD_PX = 10;

interface UseFoldingPanelParams {
  ref: RefObject<HTMLElement | null>;
  focused: boolean;
}

interface UseFoldingPanel {
  stuck: boolean;
  collapsed: boolean;
}

export const useFoldingPanel = (params: UseFoldingPanelParams): UseFoldingPanel => {
  const { ref, focused } = params;
  const { stuck } = useIsStuck({ ref });
  const { hidden } = useHideOnScroll({ threshold: FOLD_THRESHOLD_PX });

  return { stuck, collapsed: stuck && hidden && !focused };
};
