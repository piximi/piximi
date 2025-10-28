import { useCallback, useRef } from "react";

type PassedFunc = (...args: any[]) => void;

/**
 * Creates a throttled version of a callback that will only execute at most once
 * per specified delay period. Subsequent calls within the delay are ignored.
 *
 * @param callback - The function to throttle
 * @param delay - Minimum time in milliseconds between executions
 * @param deps - Dependency array for the callback (like useCallback)
 * @returns Throttled version of the callback
 *
 * @example
 * const handleScroll = useThrottledCallback(
 *   (event) => {
 *     console.log('Scrolling...', event);
 *   },
 *   100,
 *   []
 * );
 */
export function useThrottledCallback<Func extends PassedFunc>(
  callback: Func,
  delay: number,
  deps: React.DependencyList,
): Func {
  const lastExecutionTime = useRef<number>(0);

  const throttledCallback = useCallback(
    ((...args) => {
      const now = Date.now();

      if (now - lastExecutionTime.current >= delay) {
        lastExecutionTime.current = now;
        callback(...args);
      }
    }) as Func,
    [delay, ...deps],
  );

  return throttledCallback;
}
