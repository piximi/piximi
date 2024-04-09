import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { projectSlice } from "./projectSlice";
import { annotatorSlice } from "store/annotator";
import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";
import { imageViewerSlice } from "store/imageViewer";
import { newDataSlice } from "store/data";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(newDataSlice.actions.resetData());
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
