import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  imageViewerSlice,
  selectionModeSelector,
  toolTypeSelector,
  selectedAnnotationCategoryIdSelector,
} from "store/imageViewer";
import {
  selectAnnotationCategoryById,
  selectActiveImageActivePlane,
  selectWorkingAnnotation,
  dataSlice,
} from "store/data";

import {
  AnnotationModeType,
  AnnotationStateType,
  Category,
  ToolType,
} from "types";

import { AnnotationTool } from "annotator-tools";
import { encodeAnnotation } from "utils/annotator";

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
  const activeImagePlane: ReturnType<typeof selectActiveImageActivePlane> =
    yield select(selectActiveImageActivePlane);

  const selectedAnnotationCategoryId: ReturnType<
    typeof selectedAnnotationCategoryIdSelector
  > = yield select(selectedAnnotationCategoryIdSelector);

  if (selectionMode === AnnotationModeType.New) {
    const selectedCategory: Category = yield select(
      selectAnnotationCategoryById(selectedAnnotationCategoryId)
    );

    annotationTool.annotate(selectedCategory, activeImagePlane!);

    if (!annotationTool.annotation) return;

    const annotation = encodeAnnotation(annotationTool.annotation);

    yield put(dataSlice.actions.addAnnotation({ annotation: annotation! }));

    yield put(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: [annotationTool.annotation.id],
        workingAnnotationId: annotationTool.annotation.id,
      })
    );
  } else {
    const toolType: ReturnType<typeof toolTypeSelector> = yield select(
      toolTypeSelector
    );

    if (toolType === ToolType.Zoom) return;

    const workingAnnotation: ReturnType<typeof selectWorkingAnnotation> =
      yield select(selectWorkingAnnotation);

    if (annotationTool.annotationState !== AnnotationStateType.Annotated)
      return;

    let combinedMask, combinedBoundingBox;

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

    const annotation = encodeAnnotation(combinedSelectedAnnotation);

    yield put(dataSlice.actions.addAnnotation({ annotation: annotation! }));

    yield put(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: [combinedSelectedAnnotation.id],
        workingAnnotationId: combinedSelectedAnnotation.id,
      })
    );

    if (annotationTool.maskData.length) {
      const selectedCategory: Category = yield select(
        selectAnnotationCategoryById(selectedAnnotationCategoryId)
      );
      annotationTool.annotate(selectedCategory, activeImagePlane!);
    }
  }
}
