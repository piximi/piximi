import { createListenerMiddleware } from "@reduxjs/toolkit";

import { annotatorSlice } from "./annotatorSlice";

import { imageViewerSlice } from "../imageViewer";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";

import { ToolType } from "views/ImageViewer/utils/enums";

import { TypedAppStartListening } from "store/types";
import { AnnotationObject, DecodedAnnotationObject } from "store/data/types";

export const annotatorMiddleware = createListenerMiddleware();

const startAppListening =
  annotatorMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: annotatorSlice.actions.setWorkingAnnotation,
  effect: async (action, listenerAPI) => {
    const dataState = listenerAPI.getState().data;
    let annotationValue = action.payload.annotation;
    if (typeof annotationValue === "string") {
      const annotation = dataState.annotations.entities[
        annotationValue
      ] as AnnotationObject;
      if (!annotation) return undefined;
      annotationValue = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
    }
    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: annotationValue,
        preparedByListener: true,
      }),
    );
    listenerAPI.subscribe();
  },
});
startAppListening({
  actionCreator: annotatorSlice.actions.setToolType,
  effect: (action, listenerAPI) => {
    const { operation } = action.payload;
    let cursor: string;
    switch (operation) {
      case ToolType.RectangularAnnotation:
      case ToolType.EllipticalAnnotation:
        cursor = "crosshair";
        break;
      case ToolType.PenAnnotation:
        cursor = "none";
        break;
      default:
        cursor = "pointer";
    }

    listenerAPI.dispatch(imageViewerSlice.actions.setCursor({ cursor }));
  },
});
