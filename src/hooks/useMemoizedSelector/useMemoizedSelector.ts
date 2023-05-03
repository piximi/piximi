import { useMemo, useRef } from "react";
import { useSelector } from "react-redux";

//TODO - store: Get this to work
export const useMemoizedSelector = <T extends (...args: any) => any>(
  selectorFunction: T,
  args: Parameters<T>
) => {
  const passedArgs = useRef(args.slice(1));
  const memoizedSelector = useMemo(() => selectorFunction, [selectorFunction]);
  return useSelector((state) => memoizedSelector(state, passedArgs));
};
