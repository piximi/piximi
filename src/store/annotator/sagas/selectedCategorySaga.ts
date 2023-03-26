import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { AnnotatorSlice } from "store/annotator";
import {
  selectAnnotationCategoryById,
  selectWorkingAnnotation,
  selectSelectedAnnotations,
} from "store/data";
import { Category, DecodedAnnotationType } from "types";

export function* selectedCategorySaga({
  payload: { selectedCategoryId, execSaga },
}: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>) {
  if (!execSaga) return;

  const selectedCategory: Category = yield select(
    selectAnnotationCategoryById(selectedCategoryId)
  );

  const selectedAnnotations: ReturnType<typeof selectSelectedAnnotations> =
    yield select(selectSelectedAnnotations);
  if (!selectedAnnotations.length) return;

  const workingAnnotation: ReturnType<typeof selectWorkingAnnotation> =
    yield select(selectWorkingAnnotation);

  const updatedAnnotations = selectedAnnotations.map(
    (annotation: DecodedAnnotationType) => {
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
