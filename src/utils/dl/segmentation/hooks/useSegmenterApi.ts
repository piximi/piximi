import { useMemo } from "react";

import { getSegmenterApi } from "../SegmenterApi";

import type { ISegmenterApi } from "../types";

/**
 * Returns the currently-active classifier backend.
 *
 * Currently the backend is module-global ("local" by default), so this hook is
 * effectively a stable handle. When backend selection becomes user-controllable
 * (Settings UI or a Redux selector), promote the module-global to React state
 * and subscribe here.
 */
export function useSegmenterApi(): ISegmenterApi {
  // useMemo with no deps is fine: getClassifierApi() returns the cached instance,
  // and the *identity* of the backend is what consumers care about.
  return useMemo(() => getSegmenterApi(), []);
}
