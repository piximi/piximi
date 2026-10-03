import { imageViewerDataSlice } from ".";
import { selectGlobalFeatureBounds } from "./reselectors";

import type { TypedAppStartListening } from "store/types";

/**
 * The feature sliders' limits are the range of the annotations that exist, so
 * deleting the largest annotation shrinks them. A stored range that reached the
 * old limit then describes data that is gone, so it is clamped into the new
 * bounds and the clamp is *persisted* — the user's 1000 is deliberately
 * forgotten rather than lying in wait to re-widen the filter the next time a
 * larger annotation arrives.
 */
export const registerImageViewerListeners = (
  startAppListening: TypedAppStartListening,
) => {
  startAppListening({
    predicate: (_action, currentState, previousState) =>
      selectGlobalFeatureBounds(currentState) !==
      selectGlobalFeatureBounds(previousState),
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(
        imageViewerDataSlice.actions.setGlobalFeatureBounds(
          selectGlobalFeatureBounds(listenerApi.getState()),
        ),
      );
    },
  });
};
