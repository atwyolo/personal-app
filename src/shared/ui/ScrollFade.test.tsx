import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollFade } from "./ScrollFade";

/** jsdom has no layout: the scroller's sizes are set by hand, then a scroll event makes it measure them. */
const renderScroller = (sizes: { clientWidth: number; scrollWidth: number; scrollLeft: number }) => {
  render(
    <ScrollFade>
      <span>chips</span>
    </ScrollFade>,
  );
  const scroller = screen.getByText("chips").parentElement!;
  for (const [key, value] of Object.entries(sizes)) Object.defineProperty(scroller, key, { value, configurable: true });
  fireEvent.scroll(scroller);

  return scroller;
};

// jsdom has no ResizeObserver; as in Carousel.test.tsx, a stub that never reports keeps the scroll event in charge.
class FakeResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe("ScrollFade", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fades only the end while more chips wait beyond it", () => {
    const scroller = renderScroller({ clientWidth: 300, scrollWidth: 500, scrollLeft: 0 });

    expect(scroller).toHaveAttribute("data-fade-end");
    expect(scroller).not.toHaveAttribute("data-fade-start");
  });

  it("fades both edges in the middle of the row", () => {
    const scroller = renderScroller({ clientWidth: 300, scrollWidth: 500, scrollLeft: 100 });

    expect(scroller).toHaveAttribute("data-fade-start");
    expect(scroller).toHaveAttribute("data-fade-end");
  });

  it("fades only the start at the end of the row", () => {
    const scroller = renderScroller({ clientWidth: 300, scrollWidth: 500, scrollLeft: 200 });

    expect(scroller).toHaveAttribute("data-fade-start");
    expect(scroller).not.toHaveAttribute("data-fade-end");
  });

  it("fades nothing when everything fits", () => {
    const scroller = renderScroller({ clientWidth: 500, scrollWidth: 500, scrollLeft: 0 });

    expect(scroller).not.toHaveAttribute("data-fade-start");
    expect(scroller).not.toHaveAttribute("data-fade-end");
  });
});
