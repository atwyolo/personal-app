import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InterviewReveal } from "./InterviewReveal";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

const observers: ObserverStub[] = [];

class ObserverStub {
  observed: Element[] = [];
  disconnected = false;

  constructor(public callback: ObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve(target: Element) {
    this.observed = this.observed.filter((item) => item !== target);
  }

  disconnect() {
    this.disconnected = true;
    this.observed = [];
  }
}

const lineObserver = () => observers[0];
const endObserver = () => observers[1];

const renderAt = (tops: Record<string, number>) => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    return { top: tops[this.id] ?? 0 } as DOMRect;
  });

  return render(
    <InterviewReveal>
      {Object.keys(tops).map((id) => (
        <section key={id} id={id} data-testid={id} />
      ))}
    </InterviewReveal>,
  );
};

const reveals = () => screen.getByTestId("first").parentElement!;

beforeEach(() => {
  observers.length = 0;
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("IntersectionObserver", ObserverStub);
  vi.stubGlobal("innerHeight", 1000);
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("InterviewReveal", () => {
  it("turns the reveal on after hydration", () => {
    renderAt({ first: 2000 });

    expect(reveals()).toHaveAttribute("data-reveal");
  });

  it("shows what the first screen holds without waiting for an observer", () => {
    renderAt({ first: 100, second: 2000, third: 3000 });

    expect(screen.getByTestId("first")).toHaveAttribute("data-revealed");
    expect(screen.getByTestId("second")).not.toHaveAttribute("data-revealed");
    expect(lineObserver().observed).toEqual([screen.getByTestId("second"), screen.getByTestId("third")]);
  });

  it("does not hide a section between the 85% line and the bottom of the window", () => {
    renderAt({ first: 900 });

    expect(screen.getByTestId("first")).toHaveAttribute("data-revealed");
  });

  it("keeps a section that starts at the bottom edge for the scroll", () => {
    renderAt({ first: 1000 });

    expect(screen.getByTestId("first")).not.toHaveAttribute("data-revealed");
  });

  it("shows the target of a deep link and everything above it", () => {
    window.history.replaceState(null, "", "#second");

    renderAt({ first: 2000, second: 3000, third: 4000 });

    expect(screen.getByTestId("first")).toHaveAttribute("data-revealed");
    expect(screen.getByTestId("second")).toHaveAttribute("data-revealed");
    expect(screen.getByTestId("third")).not.toHaveAttribute("data-revealed");
  });

  it("reveals a section when it crosses the line, once", () => {
    renderAt({ first: 2000 });
    const target = screen.getByTestId("first");

    act(() => lineObserver().callback([{ target, isIntersecting: true }]));

    expect(target).toHaveAttribute("data-revealed");
    expect(lineObserver().observed).toEqual([]);
  });

  it("keeps a section that is still below the line hidden", () => {
    renderAt({ first: 2000 });
    const target = screen.getByTestId("first");

    act(() =>
      lineObserver().callback([{ target, isIntersecting: false, boundingClientRect: { top: 2000 } as DOMRect }]),
    );

    expect(target).not.toHaveAttribute("data-revealed");
  });

  it("reveals a section that jumped past the viewport upwards", () => {
    renderAt({ first: 2000 });
    const target = screen.getByTestId("first");

    act(() =>
      lineObserver().callback([{ target, isIntersecting: false, boundingClientRect: { top: -500 } as DOMRect }]),
    );

    expect(target).toHaveAttribute("data-revealed");
  });

  it("reveals everything left once the last section enters a tall window", () => {
    renderAt({ first: 2000, second: 3000 });
    const last = screen.getByTestId("second");
    expect(endObserver().observed).toEqual([last]);

    act(() => endObserver().callback([{ target: last, isIntersecting: true }]));

    expect(screen.getByTestId("first")).toHaveAttribute("data-revealed");
    expect(last).toHaveAttribute("data-revealed");
    expect(lineObserver().disconnected).toBe(true);
  });

  it("waits while the last section stays below the window", () => {
    renderAt({ first: 2000 });
    const last = screen.getByTestId("first");

    act(() => endObserver().callback([{ target: last, isIntersecting: false }]));

    expect(last).not.toHaveAttribute("data-revealed");
  });

  it("does not watch the end when everything is already shown", () => {
    renderAt({ first: 100 });

    expect(endObserver().observed).toEqual([]);
  });

  it("hides nothing with reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    renderAt({ first: 2000 });

    expect(reveals()).not.toHaveAttribute("data-reveal");
    expect(observers).toEqual([]);
  });

  it("hides nothing without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    renderAt({ first: 2000 });

    expect(reveals()).not.toHaveAttribute("data-reveal");
  });

  it("cleans up when the page is hidden or left", () => {
    const { unmount } = renderAt({ first: 2000 });
    const root = reveals();

    unmount();

    expect(lineObserver().disconnected).toBe(true);
    expect(endObserver().disconnected).toBe(true);
    expect(root).not.toHaveAttribute("data-reveal");
  });
});
