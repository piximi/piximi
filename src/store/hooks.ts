import { useSelector } from "react-redux";

import type { RootState } from "./rootReducer";

export function useParameterizedSelector<P extends unknown[], R>(
  selector: (state: RootState, ...params: P) => R,
  ...params: P
): R {
  return useSelector((state: RootState) => selector(state, ...params));
}
