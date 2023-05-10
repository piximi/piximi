import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "types";
import { projectSlice } from "./projectSlice";
import { dataSlice } from "store/data";
import { annotatorSlice } from "store/annotator";
import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";
import { imageViewerSlice } from "store/imageViewer";

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
