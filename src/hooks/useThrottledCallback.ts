import { useCallback, useEffect, useRef } from "react";

import { throttle, DebouncedFunc } from "lodash";

/**
 * Creates a throttled callback that properly cleans up on unmount or dependency changes.
 *
 * @param callback - The function to throttle
 * @param wait - Milliseconds to throttle
 * @param deps - Dependency array for the callback
 * @returns Throttled callback function
 *
 * @example
 * const handleMove = useThrottledCallback((event) => console.log(event), 100, []);
 */

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  wait: number,
  deps: React.DependencyList,
): T {
  // Store throttled function in ref to maintain stable reference
  const throttledRef = useRef<DebouncedFunc<T>>();

  // Store the latest callback in a ref to avoid stale closures
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create stable throttled function
  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (!throttledRef.current) {
        throttledRef.current = throttle(
          ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
          wait,
          { leading: true, trailing: true },
        );
      }

      return throttledRef.current(...args);
    }) as T,
    [wait], // Only recreate if throttle time changes
  );

  // Cleanup on unmount or when dependencies change
  useEffect(() => {
    return () => {
      throttledRef.current?.cancel();
      throttledRef.current = undefined;
    };
  }, deps);

  return throttledCallback;
}
