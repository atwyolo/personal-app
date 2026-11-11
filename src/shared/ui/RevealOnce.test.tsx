import { render, waitFor } from "@testing-library/react";
import { type FC, useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const root = document.documentElement;

const stubAnimations = (animations: { animationName: string; finished: Promise<unknown> }[]) => {
  document.getAnimations = vi.fn(() => animations as unknown as Animation[]);
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

describe("RevealOnce", () => {
  let RevealOnce: FC;

  beforeEach(async () => {
    vi.resetModules();
    ({ RevealOnce } = await import("./RevealOnce"));
  });

  afterEach(() => {
    delete root.dataset.revealed;
  });

  it("marks the page only after the wipe has ended", async () => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });

    stubAnimations([{ animationName: "wipe", finished }]);
    render(<RevealOnce />);
    await flushPromises();

    expect(root.dataset.revealed).toBeUndefined();

    finish();

    await waitFor(() => expect(root.dataset.revealed).toBe(""));
  });

  it("counts a wipe cut short by leaving the page", async () => {
    stubAnimations([{ animationName: "wipe", finished: Promise.reject(new DOMException("", "AbortError")) }]);
    render(<RevealOnce />);

    await waitFor(() => expect(root.dataset.revealed).toBe(""));
  });

  it("marks the page at once when nothing plays, as with reduced motion", async () => {
    stubAnimations([]);
    render(<RevealOnce />);

    await waitFor(() => expect(root.dataset.revealed).toBe(""));
  });

  it("does not wait for other animations", async () => {
    stubAnimations([
      { animationName: "wipe", finished: Promise.resolve() },
      { animationName: "pulse", finished: new Promise(() => {}) },
    ]);
    render(<RevealOnce />);

    await waitFor(() => expect(root.dataset.revealed).toBe(""));
  });

  it("puts the mark back during the commit when a language switch clears <html>", async () => {
    stubAnimations([{ animationName: "wipe", finished: Promise.resolve() }]);
    const { unmount } = render(<RevealOnce />);

    await waitFor(() => expect(root.dataset.revealed).toBe(""));

    unmount();
    delete root.dataset.revealed;
    stubAnimations([{ animationName: "wipe", finished: new Promise(() => {}) }]);

    let markInCommit: string | undefined;
    const CommitProbe: FC = () => {
      useLayoutEffect(() => {
        markInCommit = root.dataset.revealed;
      }, []);

      return null;
    };

    render(
      <>
        <RevealOnce />
        <CommitProbe />
      </>,
    );

    expect(markInCommit).toBe("");
  });
});
