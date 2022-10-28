import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  imageViewerSlice,
  stagedAnnotationsSelector,
  selectedAnnotationSelector,
  selectedAnnotationsIdsSelector,
  selectedAnnotationsSelector,
} from "store/image-viewer";
import { selectedCategorySelector } from "store/common";
import { decodedAnnotationType } from "types";

export function* selectedCategorySaga({
  payload: { execSaga },
}: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>) {
  if (!execSaga) return;

  const selectedAnnotationsIds: ReturnType<
    typeof selectedAnnotationsIdsSelector
  > = yield select(selectedAnnotationsIdsSelector);

  if (!selectedAnnotationsIds) return;

  const annotations: ReturnType<typeof stagedAnnotationsSelector> =
    yield select(stagedAnnotationsSelector);

  if (!annotations.length) return;

  const selectedAnnotations: ReturnType<typeof selectedAnnotationsSelector> =
    yield select(selectedAnnotationsSelector);

  const selectedCategory: ReturnType<typeof selectedCategorySelector> =
    yield select(selectedCategorySelector);

  const updatedAnnotations = selectedAnnotations.map(
    (annotation: decodedAnnotationType) => {
      return { ...annotation, categoryId: selectedCategory.id };
    }
  );

  const selectedAnnotation: ReturnType<typeof selectedAnnotationSelector> =
    yield select(selectedAnnotationSelector);

  yield put(
    imageViewerSlice.actions.setSelectedAnnotations({
      selectedAnnotations: updatedAnnotations,
      selectedAnnotation: {
        ...selectedAnnotation!,
        categoryId: selectedCategory.id,
      },
    })
  );
}
