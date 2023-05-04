import { createListenerMiddleware } from "@reduxjs/toolkit";

import {
  AnnotationModeType,
  AnnotationStateType,
  AppStartListening,
  DecodedAnnotationType,
  ToolType,
} from "types";
import { annotatorSlice } from "./annotatorSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { encodeAnnotation } from "utils/annotator";
import { dataSlice } from "store/data";
import { imageViewerSlice } from "store/imageViewer";

export const annotatorMiddleware = createListenerMiddleware();

export const startAppListening =
  annotatorMiddleware.startListening as AppStartListening;

startAppListening({
  actionCreator: annotatorSlice.actions.setAnnotationState,
  effect: async (action, listenerAPI) => {
    const { imageViewer, data, annotator } = listenerAPI.getState();

    const { annotationState, annotationTool } = action.payload;

    if (!annotationTool || annotationState !== AnnotationStateType.Annotated)
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
    if (selectionMode === AnnotationModeType.New) {
      annotationTool.annotate(
        selectedCategory,
        activeImagePlane,
        activeImageId
      );
      if (!annotationTool.annotation) return;

      const annotation = encodeAnnotation(
        annotationTool.annotation as DecodedAnnotationType
      );

      listenerAPI.dispatch(
        dataSlice.actions.addAnnotation({ annotation: annotation! })
      );
      listenerAPI.dispatch(
        imageViewerSlice.actions.addActiveAnnotationId({
          annotationId: annotation!.id,
        })
      );
      listenerAPI.dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          selectedAnnotationIds: [annotation!.id],
          workingAnnotationId: annotation!.id,
        })
      );
    } else {
      const toolType = annotator.toolType;

      if (toolType === ToolType.Zoom) return;

      const workingAnnotationId = imageViewer.workingAnnotationId;
      if (!workingAnnotationId) return;
      const workingAnnotation = getCompleteEntity(
        data.annotations.entities[workingAnnotationId]
      );

      if (
        !workingAnnotation ||
        annotationTool.annotationState !== AnnotationStateType.Annotated
      )
        return;

      let combinedMask, combinedBoundingBox;

      if (selectionMode === AnnotationModeType.Add) {
        [combinedMask, combinedBoundingBox] = annotationTool.add(
          workingAnnotation.maskData!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationModeType.Subtract) {
        [combinedMask, combinedBoundingBox] = annotationTool.subtract(
          workingAnnotation.maskData!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationModeType.Intersect) {
        [combinedMask, combinedBoundingBox] = annotationTool.intersect(
          workingAnnotation.maskData!,
          workingAnnotation.boundingBox
        );
      } else {
        return;
      }

      annotationTool.maskData = combinedMask;
      annotationTool.boundingBox = combinedBoundingBox;

      const combinedSelectedAnnotation = annotationTool.maskData.length
        ? {
            ...workingAnnotation,
            boundingBox: annotationTool.boundingBox,
            maskData: annotationTool.maskData,
          }
        : undefined;

      if (!combinedSelectedAnnotation) return;

      const annotation = encodeAnnotation(combinedSelectedAnnotation);

      listenerAPI.dispatch(
        dataSlice.actions.addAnnotation({ annotation: annotation! })
      );
      listenerAPI.dispatch(
        imageViewerSlice.actions.addActiveAnnotationId({
          annotationId: annotation!.id,
        })
      );

      listenerAPI.dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          selectedAnnotationIds: [annotation!.id],
          workingAnnotationId: annotation!.id,
        })
      );

      if (annotationTool.maskData.length) {
        annotationTool.annotate(
          selectedCategory,
          activeImagePlane!,
          activeImageId
        );
      }
    }
  },
});
