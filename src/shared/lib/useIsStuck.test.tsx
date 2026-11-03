import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsStuck } from "./useIsStuck";

const Probe = (props: { onStuck: (stuck: boolean) => void }) => {
  const { onStuck } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { stuck } = useIsStuck({ ref });
  onStuck(stuck);

  return <div ref={ref} data-testid="panel" style={{ top: "2px", ["--stick-top" as string]: "64px" }} />;
};

describe("useIsStuck", () => {
  beforeEach(() => {
    // Runs the frame at once. It returns 0 because the hook stores the id after the callback has reset it:
    // a non-zero id would look like a frame still pending and block every later measurement.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Safari reports a transitioning `top` at its end value: a panel folding from 64 px to 2 px reads "2px" while it is
  // still at 30 px. Measured against that, it looked unstuck, unfolded, looked stuck again: a loop, seen in the iOS
  // simulator on 2026-11-03. The unfolded offset in `--stick-top` never transitions.
  it("measures against the unfolded offset in --stick-top, not the transitioning top", () => {
    const seen: boolean[] = [];
    const { getByTestId } = render(<Probe onStuck={(stuck) => seen.push(stuck)} />);
    vi.spyOn(getByTestId("panel"), "getBoundingClientRect").mockReturnValue({ top: 30 } as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(seen.at(-1)).toBe(true);
  });

  it("is not stuck while the element sits below its offset", () => {
    const seen: boolean[] = [];
    const { getByTestId } = render(<Probe onStuck={(stuck) => seen.push(stuck)} />);
    vi.spyOn(getByTestId("panel"), "getBoundingClientRect").mockReturnValue({ top: 300 } as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(seen.at(-1)).toBe(false);
  });
});
