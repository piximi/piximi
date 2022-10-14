import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  imageViewerSlice,
  activeImagePlaneSelector,
  selectedAnnotationSelector,
  selectionModeSelector,
  toolTypeSelector,
} from "store/image-viewer/";
import { selectedCategorySelector } from "store/common";

import { AnnotationModeType, AnnotationStateType, ToolType } from "types";

import { AnnotationTool } from "annotator/AnnotationTools";
import { encode } from "utils/annotator";

export function* annotationStateChangeSaga({
  payload: { annotationState, annotationTool, execSaga },
}: PayloadAction<{
  annotationState: AnnotationStateType;
  annotationTool: AnnotationTool | undefined;
  execSaga: boolean;
}>) {
  if (
    !execSaga ||
    !annotationTool ||
    annotationState !== AnnotationStateType.Annotated
  )
    return;

  const selectionMode: ReturnType<typeof selectionModeSelector> = yield select(
    selectionModeSelector
  );
  const activeImagePlane: ReturnType<typeof activeImagePlaneSelector> =
    yield select(activeImagePlaneSelector);

  if (selectionMode === AnnotationModeType.New) {
    const selectedCategory: ReturnType<typeof selectedCategorySelector> =
      yield select(selectedCategorySelector);

    annotationTool.annotate(selectedCategory, activeImagePlane);

    if (!annotationTool.annotation) return;

    yield put(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [annotationTool.annotation],
        selectedAnnotation: annotationTool.annotation,
      })
    );
  } else {
    const toolType: ReturnType<typeof toolTypeSelector> = yield select(
      toolTypeSelector
    );

    if (toolType === ToolType.Zoom) return;

    const selectedAnnotation: ReturnType<typeof selectedAnnotationSelector> =
      yield select(selectedAnnotationSelector);

    if (annotationTool.annotationState !== AnnotationStateType.Annotated)
      return;

    let combinedMask, combinedBoundingBox;

    if (!selectedAnnotation) return;

    if (selectionMode === AnnotationModeType.Add) {
      [combinedMask, combinedBoundingBox] = annotationTool.add(
        selectedAnnotation.maskData!,
        selectedAnnotation.boundingBox
      );
    } else if (selectionMode === AnnotationModeType.Subtract) {
      [combinedMask, combinedBoundingBox] = annotationTool.subtract(
        selectedAnnotation.maskData!,
        selectedAnnotation.boundingBox
      );
    } else if (selectionMode === AnnotationModeType.Intersect) {
      [combinedMask, combinedBoundingBox] = annotationTool.intersect(
        selectedAnnotation.maskData!,
        selectedAnnotation.boundingBox
      );
    } else {
      return;
    }

    annotationTool.maskData = combinedMask;
    annotationTool.boundingBox = combinedBoundingBox;
    annotationTool.mask = encode(combinedMask);

    const combinedSelectedAnnotation = annotationTool.maskData.length
      ? {
          ...selectedAnnotation,
          boundingBox: annotationTool.boundingBox,
          mask: annotationTool.mask,
          maskData: annotationTool.maskData,
        }
      : undefined;

    if (!combinedSelectedAnnotation) return;

    yield put(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [combinedSelectedAnnotation],
        selectedAnnotation: combinedSelectedAnnotation,
      })
    );

    if (annotationTool.maskData.length) {
      const selectedCategory: ReturnType<typeof selectedCategorySelector> =
        yield select(selectedCategorySelector);
      annotationTool.annotate(selectedCategory, activeImagePlane);
    }
  }
}
