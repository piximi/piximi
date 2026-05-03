import { createListenerMiddleware } from "@reduxjs/toolkit";

import { classifierSlice } from "store/classifier";
import type { TypedAppStartListening } from "store/types";
import { segmenterSlice } from "store/segmenter";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { measurementsSlice } from "store/measurements";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";

import classifierHandler from "utils/dl/classification/classifierHandler";

import { projectSlice } from "./projectSlice";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(dataSliceV2.actions.clearState());
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
