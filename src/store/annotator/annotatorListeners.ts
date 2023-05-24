import { createListenerMiddleware } from "@reduxjs/toolkit";

import {
  AnnotationModeType,
  AnnotationStateType,
  TypedAppStartListening,
  DecodedAnnotationType,
  ToolType,
} from "types";
import { annotatorSlice } from "./annotatorSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { encodeAnnotation } from "utils/annotator";
//import { dataSlice } from "store/data";
import { imageViewerSlice } from "store/imageViewer";

export const annotatorMiddleware = createListenerMiddleware();

const startAppListening =
  annotatorMiddleware.startListening as TypedAppStartListening;

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

      // listenerAPI.dispatch(
      //   dataSlice.actions.addAnnotation({ annotation: annotation! })
      // );
      listenerAPI.dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: annotation!,
        })
      );
      // listenerAPI.dispatch(
      //   imageViewerSlice.actions.addActiveAnnotationId({
      //     annotationId: annotation!.id,
      //   })
      // );
      // listenerAPI.dispatch(
      //   imageViewerSlice.actions.setSelectedAnnotationIds({
      //     annotationIds: [annotation!.id],
      //     workingAnnotationId: annotation!.id,
      //   })
      // );
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

      // listenerAPI.dispatch(
      //   dataSlice.actions.addAnnotation({ annotation: annotation! })
      // );
      // listenerAPI.dispatch(
      //   imageViewerSlice.actions.addActiveAnnotationId({
      //     annotationId: annotation!.id,
      //   })
      // );

      // listenerAPI.dispatch(
      //   imageViewerSlice.actions.setSelectedAnnotationIds({
      //     annotationIds: [annotation!.id],
      //     workingAnnotationId: annotation!.id,
      //   })
      // );
      listenerAPI.dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: annotation!,
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
