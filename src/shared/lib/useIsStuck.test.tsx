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
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
