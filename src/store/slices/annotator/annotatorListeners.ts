import { createListenerMiddleware } from "@reduxjs/toolkit";

import {
  AnnotationModeType,
  AnnotationStateType,
  TypedAppStartListening,
  ToolType,
} from "types";
import { annotatorSlice } from "./annotatorSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { encodeAnnotation } from "utils/annotator";
//import { dataSlice } from "store/data";
import { imageViewerSlice } from "store/slices/imageViewer";
import { BlankAnnotationTool } from "annotator-tools/BlankAnnotationTool";

export const annotatorMiddleware = createListenerMiddleware();

const startAppListening =
  annotatorMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: annotatorSlice.actions.setAnnotationState,
  effect: async (action, listenerAPI) => {
    const { imageViewer, data, annotator } = listenerAPI.getState();
    const { annotationState, annotationTool } = action.payload;

    if (
      annotationTool instanceof BlankAnnotationTool ||
      annotationState !== AnnotationStateType.Annotated
    )
      return;
    const selectionMode = annotator.selectionMode;
    const activeImageId = imageViewer.activeImageId;
    if (!activeImageId) return;
    const activeImagePlane = getDeferredProperty(
      data.images.entities[activeImageId],
      "activePlane"
    );
    const selectedAnnotationCategoryId = imageViewer.selectedCategoryId;
    const selectedCategory = getCompleteEntity(
      data.annotationCategories.entities[selectedAnnotationCategoryId]
    )!;

    if (
      selectionMode === AnnotationModeType.New &&
      annotationTool.annotationState === AnnotationStateType.Annotated
    ) {
      annotationTool.annotate(
        selectedCategory,
        activeImagePlane,
        activeImageId
      );
      if (!annotationTool.annotation) return;

      listenerAPI.dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: annotationTool.annotation,
        })
      );
    } else {
      const toolType = annotator.toolType;

      if (toolType === ToolType.Zoom) return;
      const savedWorkingAnnotation = imageViewer.workingAnnotation.saved;
      const workingAnnotationChanges = imageViewer.workingAnnotation.changes;
      if (
        !savedWorkingAnnotation ||
        annotationTool.annotationState !== AnnotationStateType.Annotated
      )
        return;
      const workingAnnotation = {
        ...savedWorkingAnnotation,
        ...workingAnnotationChanges,
      };
      let combinedMask, combinedBoundingBox;

      if (selectionMode === AnnotationModeType.Add) {
        [combinedMask, combinedBoundingBox] = annotationTool.add(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationModeType.Subtract) {
        [combinedMask, combinedBoundingBox] = annotationTool.subtract(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationModeType.Intersect) {
        [combinedMask, combinedBoundingBox] = annotationTool.intersect(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else {
        return;
      }

      annotationTool.decodedMask = combinedMask;
      annotationTool.boundingBox = combinedBoundingBox;

      const combinedSelectedAnnotation = annotationTool.decodedMask.length
        ? {
            ...workingAnnotation,
            boundingBox: annotationTool.boundingBox,
            decodedMask: annotationTool.decodedMask,
          }
        : undefined;

      if (!combinedSelectedAnnotation) return;

      const annotation = encodeAnnotation(combinedSelectedAnnotation);

      listenerAPI.dispatch(
        imageViewerSlice.actions.updateWorkingAnnotation({
          changes: annotation!,
        })
      );

      if (annotationTool.decodedMask.length) {
        annotationTool.annotate(
          selectedCategory,
          activeImagePlane!,
          activeImageId
        );
      }
    }
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
