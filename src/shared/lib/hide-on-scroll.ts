export interface HideState {
  hidden: boolean;
  lastY: number;
  travel: number;
}

export const nextHideState = (state: HideState, y: number, maxY: number, threshold: number): HideState => {
  if (y < 0 || y > maxY) return state;

  const delta = y - state.lastY;
  const sameDirection = Math.sign(delta) === Math.sign(state.travel) || state.travel === 0;
  const travel = sameDirection ? state.travel + delta : delta;

  if (travel >= threshold) return { hidden: true, lastY: y, travel: 0 };
  if (travel <= -threshold) return { hidden: false, lastY: y, travel: 0 };

  return { hidden: state.hidden, lastY: y, travel };
};
