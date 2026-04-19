import { useSelector } from "react-redux";
import { RootState } from "./rootReducer";

export function useParameterizedSelector<P, R>(
  selector: (state: RootState, param: P) => R,
  param: P,
): R {
  return useSelector((state: RootState) => selector(state, param));
}
