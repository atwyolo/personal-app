import { useEffect, useState } from "react";

interface UseDebouncedValueParams<T> {
  value: T;
  delay: number;
  isImmediate?: (value: T) => boolean;
}

interface UseDebouncedValue<T> {
  debouncedValue: T;
}

export const useDebouncedValue = <T>(params: UseDebouncedValueParams<T>): UseDebouncedValue<T> => {
  const { value, delay, isImmediate } = params;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const immediate = isImmediate?.(value) ?? false;

  if (immediate && !Object.is(debouncedValue, value)) setDebouncedValue(value);

  useEffect(() => {
    if (immediate) return;

    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay, immediate]);

  return { debouncedValue };
};
