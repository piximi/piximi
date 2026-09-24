import { dataSlice } from "store/data";
import {
  selectAnnotationEntities,
  selectImageEntities,
} from "store/data/selectors";

import { projectSlice } from "./projectSlice";

import type { TypedAppStartListening } from "store/types";

/*
 * Every dataSlice action that can orphan a grid selection: the `delete*` /
 * `batchDelete*` reducers, derived by name so future ones are covered, plus the
 * two that swap the whole data state out from under the grids.
 */
const orphaningActionTypes = new Set<string>([
  ...Object.entries(dataSlice.actions)
    .filter(([name]) => name.toLowerCase().includes("delete"))
    .map(([, actionCreator]) => actionCreator.type),
  dataSlice.actions.resetState.type,
  dataSlice.actions.clearState.type,
]);

export const registerProjectViewerListeners = (
  startAppListening: TypedAppStartListening,
) => {
  startAppListening({
    predicate: (action) => orphaningActionTypes.has(action.type),
    effect: (_action, listenerApi) => {
      const state = listenerApi.getState();
      const imageEntities = selectImageEntities(state);
      const annotationEntities = selectAnnotationEntities(state);
      const { imageGridState, annotationGridState } = state.project;

      const imageIds = imageGridState.selectedIds.filter(
        (id) => !imageEntities[id],
      );

      const annotationIdsByKind: Record<string, string[]> = {};
      for (const kindId in annotationGridState.kindStates) {
        const stale = annotationGridState.kindStates[kindId].selectedIds.filter(
          (id) => !annotationEntities[id],
        );
        if (stale.length) annotationIdsByKind[kindId] = stale;
      }

      if (!imageIds.length && !Object.keys(annotationIdsByKind).length) return;

      listenerApi.dispatch(
        projectSlice.actions.removeStaleSelections({
          imageIds,
          annotationIdsByKind,
        }),
      );
    },
  });
};
