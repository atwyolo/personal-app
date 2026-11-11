import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./useDebouncedValue";

const isBlank = (value: string) => value.trim() === "";

const renderDebounced = (initial: string, isImmediate?: (value: string) => boolean) =>
  renderHook((props: { value: string }) => useDebouncedValue({ value: props.value, delay: 300, isImmediate }), {
    initialProps: { value: initial },
  });

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the first value at once", () => {
    const { result } = renderDebounced("a");

    expect(result.current.debouncedValue).toBe("a");
  });

  it("returns a new value only after the delay", () => {
    const { result, rerender } = renderDebounced("");

    rerender({ value: "dock" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.debouncedValue).toBe("");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.debouncedValue).toBe("dock");
  });

  it("restarts the wait on every change", () => {
    const { result, rerender } = renderDebounced("");

    rerender({ value: "d" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "do" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "doc" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.debouncedValue).toBe("");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.debouncedValue).toBe("doc");
  });

  it("applies an immediate value at once, and the pending one never lands after it", () => {
    const { result, rerender } = renderDebounced("", isBlank);

    rerender({ value: "dock" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "" });
    expect(result.current.debouncedValue).toBe("");

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.debouncedValue).toBe("");
  });

  it("leaves no timer behind when it unmounts", () => {
    const { rerender, unmount } = renderDebounced("");

    rerender({ value: "dock" });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
