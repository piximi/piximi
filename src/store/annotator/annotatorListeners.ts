import { createListenerMiddleware } from "@reduxjs/toolkit";

import { TypedAppStartListening } from "store/types";
import { annotatorSlice } from "./annotatorSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { imageViewerSlice } from "store/imageViewer";
import { intersection } from "lodash";
import { encodeAnnotation } from "utils/annotator/rle";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";
import { getPropertiesFromImage } from "utils/common/helpers";
import { BlankAnnotationTool } from "utils/annotator/tools";
import { DecodedAnnotationObject, ImageObject } from "store/data/types";

export const annotatorMiddleware = createListenerMiddleware();

const startAppListening =
  annotatorMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: annotatorSlice.actions.setAnnotationState,
  effect: async (action, listenerAPI) => {
    const {
      imageViewer: IVState,
      data: dataState,
      annotator: annotatorState,
    } = listenerAPI.getState();
    const { annotationState, annotationTool, kind } = action.payload;

    if (
      annotationTool instanceof BlankAnnotationTool ||
      annotationState !== AnnotationState.Annotated ||
      !kind
    )
      return;
    const kindObject = getCompleteEntity(dataState.kinds.entities[kind]);
    if (!kindObject) return;
    const selectionMode = annotatorState.selectionMode;
    const activeImageId = IVState.activeImageId;
    if (!activeImageId) return;
    const activeImage = getCompleteEntity(
      dataState.things.entities[activeImageId]
    ) as ImageObject;
    if (!activeImage) return;
    const selectedAnnotationCategoryId = IVState.selectedCategoryId;
    const selectedCategory = getCompleteEntity(
      dataState.categories.entities[selectedAnnotationCategoryId]
    )!;

    if (
      selectionMode === AnnotationMode.New &&
      annotationTool.annotationState === AnnotationState.Annotated
    ) {
      annotationTool.annotate(
        selectedCategory,
        activeImage!.activePlane,
        activeImageId
      );
      if (!annotationTool.annotation) return;
      const bbox = annotationTool.annotation.boundingBox;

      const bitDepth = activeImage.bitDepth;
      const imageProperties = await getPropertiesFromImage(
        activeImage,
        annotationTool.annotation!
      );
      //TODO: add suppoert for multiple planes
      const shape = {
        planes: 1,
        height: bbox[3] - bbox[1],
        width: bbox[2] - bbox[0],
        channels: activeImage.shape.channels,
      };

      const currentAnnotationNames = intersection(
        activeImage.containing,
        kindObject.containing
      ).map((id) => {
        return getDeferredProperty(dataState.things.entities[id], "name");
      });

      let annotationName: string = `${activeImage.name}-${kind}_0`;
      let i = 1;
      while (annotationName in currentAnnotationNames) {
        annotationName = annotationName.split("_")[0] + `_${i}`;
      }

      listenerAPI.dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: {
            ...annotationTool.annotation,
            ...imageProperties,
            bitDepth,
            shape,
            name: annotationName,
            kind,
          } as DecodedAnnotationObject,
        })
      );
    } else {
      const toolType = annotatorState.toolType;

      if (toolType === ToolType.Zoom) return;
      const savedWorkingAnnotation = IVState.workingAnnotation.saved;
      const workingAnnotationChanges = IVState.workingAnnotation.changes;
      if (
        !savedWorkingAnnotation ||
        annotationTool.annotationState !== AnnotationState.Annotated
      )
        return;
      const workingAnnotation = {
        ...savedWorkingAnnotation,
        ...workingAnnotationChanges,
      };
      let combinedMask, combinedBoundingBox;

      if (selectionMode === AnnotationMode.Add) {
        [combinedMask, combinedBoundingBox] = annotationTool.add(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationMode.Subtract) {
        [combinedMask, combinedBoundingBox] = annotationTool.subtract(
          workingAnnotation.decodedMask!,
          workingAnnotation.boundingBox
        );
      } else if (selectionMode === AnnotationMode.Intersect) {
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
          activeImage.activePlane,
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
