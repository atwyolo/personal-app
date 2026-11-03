export interface HideState {
  hidden: boolean;
  /** The last scroll position taken into account. */
  lastY: number;
  /** Distance scrolled in the current direction: positive down, negative up. */
  travel: number;
}

/**
 * One step of "hide while scrolling down, show while scrolling up". The travel adds up in one direction and starts
 * over when it turns, so a finger's jitter never flips the state; a position outside `0..maxY` is iOS's rubber band
 * at an end of the page, which bounces back by itself, so it changes nothing.
 */
export const nextHideState = (state: HideState, y: number, maxY: number, threshold: number): HideState => {
  if (y < 0 || y > maxY) return state;

  const delta = y - state.lastY;
  const sameDirection = Math.sign(delta) === Math.sign(state.travel) || state.travel === 0;
  const travel = sameDirection ? state.travel + delta : delta;

  if (travel >= threshold) return { hidden: true, lastY: y, travel: 0 };
  if (travel <= -threshold) return { hidden: false, lastY: y, travel: 0 };

  return { hidden: state.hidden, lastY: y, travel };
};
