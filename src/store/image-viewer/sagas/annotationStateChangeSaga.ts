import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  imageViewerSlice,
  activeImagePlaneSelector,
  selectedAnnotationSelector,
  selectionModeSelector,
  toolTypeSelector,
  setSelectedAnnotations,
} from "store/image-viewer/";
import { selectedCategorySelector } from "store/common";

import { AnnotationModeType, AnnotationStateType, ToolType } from "types";

import { AnnotationTool } from "annotator/AnnotationTools";

export function* annotationStateChangeSaga({
  payload: { annotationState, annotationTool },
}: PayloadAction<{
  annotationState: AnnotationStateType;
  annotationTool: AnnotationTool | undefined;
  execSaga: boolean;
}>) {
  const selectionMode: ReturnType<typeof selectionModeSelector> = yield select(
    selectionModeSelector
  );
  const activeImagePlane: ReturnType<typeof activeImagePlaneSelector> =
    yield select(activeImagePlaneSelector);
  const toolType: ReturnType<typeof toolTypeSelector> = yield select(
    toolTypeSelector
  );
  const selectedAnnotation: ReturnType<typeof selectedAnnotationSelector> =
    yield select(selectedAnnotationSelector);
  const selectedCategory: ReturnType<typeof selectedCategorySelector> =
    yield select(selectedCategorySelector);
  let combinedMask, combinedBoundingBox;

  if (!annotationTool) return;

  if (annotationState !== AnnotationStateType.Annotated) return;

  if (selectionMode === AnnotationModeType.New) {
    annotationTool.annotate(selectedCategory, activeImagePlane);
    if (!annotationTool.annotation) return;

    yield put(
      setSelectedAnnotations({
        selectedAnnotations: [annotationTool.annotation],
        selectedAnnotation: annotationTool.annotation,
      })
    );
  } else {
    if (
      toolType === ToolType.Zoom ||
      annotationTool.annotationState !== AnnotationStateType.Annotated ||
      !selectedAnnotation
    ) {
      return;
    }

    switch (selectionMode) {
      case AnnotationModeType.Add:
        [combinedMask, combinedBoundingBox] = annotationTool.add(
          selectedAnnotation.mask,
          selectedAnnotation.boundingBox
        );
        break;

      case AnnotationModeType.Subtract:
        [combinedMask, combinedBoundingBox] = annotationTool.subtract(
          selectedAnnotation.mask,
          selectedAnnotation.boundingBox
        );
        break;
      case AnnotationModeType.Intersect:
        [combinedMask, combinedBoundingBox] = annotationTool.intersect(
          selectedAnnotation.mask,
          selectedAnnotation.boundingBox
        );
        break;
      default:
        return;
    }

    annotationTool.mask = combinedMask;
    annotationTool.boundingBox = combinedBoundingBox;

    const combinedSelectedAnnotation = annotationTool.mask.length
      ? {
          ...selectedAnnotation,
          boundingBox: annotationTool.boundingBox,
          mask: annotationTool.mask,
        }
      : undefined;

    if (!combinedSelectedAnnotation) return;

    yield put(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [combinedSelectedAnnotation],
        selectedAnnotation: combinedSelectedAnnotation,
      })
    );

    if (annotationTool.mask.length) {
      const selectedCategory: ReturnType<typeof selectedCategorySelector> =
        yield select(selectedCategorySelector);
      annotationTool.annotate(selectedCategory, activeImagePlane);
    }
  }
}
