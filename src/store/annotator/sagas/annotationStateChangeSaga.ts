import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  AnnotatorSlice,
  activeImagePlaneSelector,
  workingAnnotationSelector,
  selectionModeSelector,
  toolTypeSelector,
} from "store/annotator";
import { selectedCategorySelector } from "store/common";

import { AnnotationModeType, AnnotationStateType, ToolType } from "types";

import { AnnotationTool } from "annotator-tools";

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
      AnnotatorSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [annotationTool.annotation],
        workingAnnotation: annotationTool.annotation,
      })
    );
  } else {
    const toolType: ReturnType<typeof toolTypeSelector> = yield select(
      toolTypeSelector
    );

    if (toolType === ToolType.Zoom) return;

    const workingAnnotation: ReturnType<typeof workingAnnotationSelector> =
      yield select(workingAnnotationSelector);

    if (annotationTool.annotationState !== AnnotationStateType.Annotated)
      return;
  }

  switch (selectionMode) {
    case AnnotationModeType.Add:
      [combinedMask, combinedBoundingBox] = annotationTool.add(
        selectedAnnotation.mask,
        selectedAnnotation.boundingBox
      );
      break;

      if (!workingAnnotation) return;

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

      yield put(
        imageViewerSlice.actions.setSelectedAnnotations({
          selectedAnnotations: [combinedSelectedAnnotation],
          workingAnnotation: combinedSelectedAnnotation,
        })
      );

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

      yield put(
        AnnotatorSlice.actions.setSelectedAnnotations({
          selectedAnnotations: [combinedSelectedAnnotation],
          workingAnnotation: combinedSelectedAnnotation,
        })
      );

      if (annotationTool.maskData.length) {
        const selectedCategory: ReturnType<typeof selectedCategorySelector> =
          yield select(selectedCategorySelector);
        annotationTool.annotate(selectedCategory, activeImagePlane);
      }
  }
}