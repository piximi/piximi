import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { projectSlice } from "./projectSlice";
import { annotatorSlice } from "store/annotator";
import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";
import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data";
import { difference, intersection } from "lodash";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(dataSlice.actions.resetData());
    listenerAPI.dispatch(annotatorSlice.actions.resetAnnotator());
    listenerAPI.dispatch(classifierSlice.actions.resetClassifier());
    listenerAPI.dispatch(segmenterSlice.actions.resetSegmenter());
    listenerAPI.dispatch(imageViewerSlice.actions.resetImageViewer());
  },
});

startAppListening({
  actionCreator: projectSlice.actions.sendLoadPercent,
  effect: async (action, listenerApi) => {
    // do work
    listenerApi.dispatch(
      projectSlice.actions.setLoadPercent({
        loadPercent: action.payload.loadPercent,
        loadMessage: action.payload.loadMessage,
      })
    );

    // prevent others from doing work
    listenerApi.unsubscribe();

    // for the next 100ms
    await listenerApi.delay(100);

    // then continue letting others do work
    listenerApi.subscribe();
  },
});

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(dataSlice.actions.resetData());
    listenerAPI.dispatch(annotatorSlice.actions.resetAnnotator());
    listenerAPI.dispatch(classifierSlice.actions.resetClassifier());
    listenerAPI.dispatch(segmenterSlice.actions.resetSegmenter());
    listenerAPI.dispatch(imageViewerSlice.actions.resetImageViewer());
  },
});

startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.data.categories.ids.length <
      previousState.data.categories.ids.length
    );
  },
  effect: async (action, listenerApi) => {
    const { project, data } = listenerApi.getState();
    const { data: oldData } = listenerApi.getOriginalState();
    const deletedCategories = difference(
      oldData.categories.ids,
      data.categories.ids
    ) as string[];
    const filters = project.thingFilters;
    for (let kind in filters) {
      const filteredCats = filters[kind].categoryId;
      const deletedFilters = intersection(filteredCats, deletedCategories);
      if (deletedFilters.length > 0) {
        listenerApi.dispatch(
          projectSlice.actions.removeThingCategoryFilters({
            categoryIds: deletedFilters,
            kinds: [kind],
          })
        );
      }
    }
  },
});

startAppListening({
  actionCreator: dataSlice.actions.deleteKind,
  effect: async (action, listenerApi) => {
    const { data } = listenerApi.getState();
    const { data: oldData } = listenerApi.getOriginalState();
    const deletedKinds = difference(
      oldData.kinds.ids,
      data.kinds.ids
    ) as string[];

    listenerApi.dispatch(
      projectSlice.actions.removeThingCategoryFilters({
        categoryIds: "all",
        kinds: deletedKinds,
      })
    );
    listenerApi.dispatch(
      projectSlice.actions.removeThingPartitionFilters({
        partitions: "all",
        kinds: deletedKinds,
      })
    );
  },
});
