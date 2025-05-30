import { createListenerMiddleware } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";
import { projectSlice } from "./projectSlice";

import classifierHandler from "utils/models/classification/classifierHandler";
import { TypedAppStartListening } from "store/types";
import { segmenterSlice } from "store/segmenter";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { measurementsSlice } from "store/measurements";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(dataSlice.actions.resetData());
    listenerAPI.dispatch(classifierSlice.actions.resetClassifiers());
    listenerAPI.dispatch(segmenterSlice.actions.resetSegmenter());
    listenerAPI.dispatch(imageViewerSlice.actions.resetImageViewer());
    listenerAPI.dispatch(measurementsSlice.actions.resetMeasurements());
  },
});

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: () => {
    classifierHandler.removeAllModels();
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
      data.categories.ids,
    ) as string[];
    const filters = project.thingFilters;
    for (const kind in filters) {
      const filteredCats = filters[kind].categoryId;
      const deletedFilters = intersection(filteredCats, deletedCategories);
      if (deletedFilters.length > 0) {
        listenerApi.dispatch(
          projectSlice.actions.removeThingCategoryFilters({
            categoryIds: deletedFilters,
            kinds: [kind],
          }),
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
      data.kinds.ids,
    ) as string[];

    listenerApi.dispatch(
      projectSlice.actions.removeThingCategoryFilters({
        categoryIds: "all",
        kinds: deletedKinds,
      }),
    );
    listenerApi.dispatch(
      projectSlice.actions.removeThingPartitionFilters({
        partitions: "all",
        kinds: deletedKinds,
      }),
    );
  },
});

startAppListening({
  predicate: (action, currentState, previousState) => {
    return (
      currentState.project.imageChannels !== previousState.project.imageChannels
    );
  },
  effect: async (action, listenerApi) => {
    const { project } = listenerApi.getState();

    if (project.imageChannels)
      listenerApi.dispatch(
        classifierSlice.actions.updateChannelsGlobally({
          globalChannels: project.imageChannels,
        }),
      );
  },
});

startAppListening({
  actionCreator: dataSlice.actions.deleteThings,
  effect: (action, listenerAPI) => {
    const { project, data } = listenerAPI.getState();
    if (action.payload.preparedByListener && "thingIds" in action.payload) {
      const { thingIds } = action.payload;
      const selectedThings = project.selectedThingIds;
      const implicitThingIds: string[] = [];
      for (const thingId of thingIds) {
        const thing = data.things.entities[thingId];
        if (!thing) continue;
        if ("containing" in thing) {
          const containedThingIds = thing.containing;
          implicitThingIds.push(...containedThingIds);
        }
      }
      const deletedThingsToDeselect = intersection(
        [...thingIds, ...implicitThingIds],
        selectedThings,
      );

      listenerAPI.dispatch(
        projectSlice.actions.deselectThings({ ids: deletedThingsToDeselect }),
      );
    }

    return;
  },
});
