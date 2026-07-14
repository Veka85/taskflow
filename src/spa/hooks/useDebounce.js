import { useState, useEffect } from 'react';

// CONCEPT — Debouncing:
// When a user types in a search box, we don't want to fire an API request
// on every single keystroke (e.g. "t", "ta", "tas", "task"...).
// Debouncing waits until the user STOPS typing for `delay` milliseconds,
// then fires the request once. This dramatically reduces API calls.
//
// HOW IT WORKS:
// 1. User types "t" → sets a 300ms timer
// 2. User types "ta" → CANCELS previous timer, sets NEW 300ms timer
// 3. User types "tas" → CANCELS again, new timer...
// 4. User stops typing → timer runs → debouncedValue updates → API call fires

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timer to update the debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // CONCEPT — Cleanup function:
    // React calls this before running the effect again (or on unmount).
    // It cancels the previous timer when value changes, implementing debounce.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
