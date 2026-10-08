import { useEffect, useRef } from "react";

type PassedFunc = (...args: any[]) => void;
type Timer = ReturnType<typeof setTimeout>;

export function useDebounce<Func extends PassedFunc>(
  func: Func,
  delay: number,
) {
  // State and setters for debounced value
  const timer = useRef<Timer | null>(null);

  useEffect(() => {
    return () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
    };
  }, []);

  const debouncedFunction = ((...args) => {
    const newTimer = setTimeout(() => {
      func(...args);
    }, delay);
    timer.current && clearTimeout(timer.current);
    timer.current = newTimer;
  }) as Func;

  return debouncedFunction;
}
