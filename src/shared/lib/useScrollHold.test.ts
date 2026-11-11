import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useScrollHold } from "./useScrollHold";

const fire = (...types: string[]) => {
  for (const type of types) window.dispatchEvent(new Event(type));
};

describe("useScrollHold", () => {
  it("starts released", () => {
    const { result } = renderHook(() => useScrollHold());

    expect(result.current.isHeld()).toBe(false);
  });

  it("holds through a scroll nobody started by hand", () => {
    const { result } = renderHook(() => useScrollHold());

    act(() => result.current.hold());
    fire("scroll");

    expect(result.current.isHeld()).toBe(true);
  });

  it.each(["wheel", "touchmove", "keydown", "pointerdown"])("releases on %s followed by a scroll", (type) => {
    const { result } = renderHook(() => useScrollHold());

    act(() => result.current.hold());
    fire(type, "scroll");

    expect(result.current.isHeld()).toBe(false);
  });

  it("holds through a press that moves nothing", () => {
    const { result } = renderHook(() => useScrollHold());

    act(() => result.current.hold());
    fire("pointerdown");

    expect(result.current.isHeld()).toBe(true);
  });

  it("does not count the press that started the hold", () => {
    const { result } = renderHook(() => useScrollHold());

    fire("pointerdown");
    act(() => result.current.hold());
    fire("scroll");

    expect(result.current.isHeld()).toBe(true);
  });

  it("stops listening after unmount", () => {
    const { result, unmount } = renderHook(() => useScrollHold());

    act(() => result.current.hold());
    unmount();
    fire("keydown", "scroll");

    expect(result.current.isHeld()).toBe(true);
  });

  it("lets go on request", () => {
    const { result } = renderHook(() => useScrollHold());

    act(() => result.current.hold());
    act(() => result.current.release());

    expect(result.current.isHeld()).toBe(false);
  });

  it("keeps the same functions between renders", () => {
    const { result, rerender } = renderHook(() => useScrollHold());
    const { hold, release, isHeld } = result.current;

    rerender();

    expect(result.current.hold).toBe(hold);
    expect(result.current.release).toBe(release);
    expect(result.current.isHeld).toBe(isHeld);
  });
});
