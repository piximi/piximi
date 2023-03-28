import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  selectAnnotationCategoryById,
  selectSelectedAnnotations,
  dataSlice,
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

  const updatedAnnotations = selectedAnnotations.map(
    (annotation: DecodedAnnotationType) => {
      return { id: annotation.id, categoryId: selectedCategory.id };
    }
  );

  yield put(
    dataSlice.actions.updateAnnotations({ updates: updatedAnnotations })
  );
}
