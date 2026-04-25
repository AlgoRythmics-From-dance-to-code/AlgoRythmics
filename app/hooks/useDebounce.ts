'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook that returns a debounced version of the provided value.
 * Useful for limiting the frequency of expensive operations like API calls or analytics tracking.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
