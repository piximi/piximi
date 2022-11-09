import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  AnnotatorSlice,
  workingAnnotationSelector,
  selectedAnnotationsSelector,
} from "store/annotator";
import { selectedCategorySelector } from "store/common";
import { decodedAnnotationType } from "types";

export function* selectedCategorySaga({
  payload: { execSaga },
}: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>) {
  if (!execSaga) return;

  const selectedCategory: ReturnType<typeof selectedCategorySelector> =
    yield select(selectedCategorySelector);

  const selectedAnnotations: ReturnType<typeof selectedAnnotationsSelector> =
    yield select(selectedAnnotationsSelector);
  if (!selectedAnnotations.length) return;

  const workingAnnotation: ReturnType<typeof workingAnnotationSelector> =
    yield select(workingAnnotationSelector);

  const updatedAnnotations = selectedAnnotations.map(
    (annotation: decodedAnnotationType) => {
      return { ...annotation, categoryId: selectedCategory.id };
    }
  );

  yield put(
    AnnotatorSlice.actions.setSelectedAnnotations({
      workingAnnotation: {
        ...workingAnnotation!,
        categoryId: selectedCategory.id,
      },
      selectedAnnotations: selectedAnnotations,
    })
  );

  yield put(
    AnnotatorSlice.actions.updateStagedAnnotations({
      annotations: updatedAnnotations,
    })
  );
}
