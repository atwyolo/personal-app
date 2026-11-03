import { useEffect, useState } from "react";

interface UseDebouncedValueParams<T> {
  value: T;
  /** Milliseconds of quiet before a new value lands. */
  delay: number;
  /** Values that land at once, without the wait, e.g. a cleared search field. */
  isImmediate?: (value: T) => boolean;
}

interface UseDebouncedValue<T> {
  debouncedValue: T;
}

/** A value that follows `value` only after it stops changing for `delay` ms. */
export const useDebouncedValue = <T>(params: UseDebouncedValueParams<T>): UseDebouncedValue<T> => {
  const { value, delay, isImmediate } = params;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const immediate = isImmediate?.(value) ?? false;

  // An immediate value is adopted during render, React's pattern for state that follows a prop: no extra frame
  // with the old value, and no effect that only copies state.
  if (immediate && !Object.is(debouncedValue, value)) setDebouncedValue(value);

  useEffect(() => {
    if (immediate) return;

    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // A newer value, or unmounting, cancels the pending one: an old query never lands after a newer one.
    return () => clearTimeout(timer);
  }, [value, delay, immediate]);

  return { debouncedValue };
};
