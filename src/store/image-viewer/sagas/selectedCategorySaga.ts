import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";
import * as _ from "lodash";

import {
  imageViewerSlice,
  imageInstancesSelector,
  selectedAnnotationSelector,
  selectedAnnotationsIdsSelector,
  selectedAnnotationsSelector,
} from "store/image-viewer";
import { selectedCategorySelector } from "store/common";
import { AnnotationType } from "types";

// eslint-disable-next-line no-empty-pattern
export function* selectedCategorySaga({
  payload: { execSaga },
}: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>): any {
  if (!execSaga) return;

  const selectedAnnotationsIds = yield select(selectedAnnotationsIdsSelector);
  if (!selectedAnnotationsIds) return;

  const annotations = yield select(imageInstancesSelector);
  if (!annotations.length) return;

  const selectedAnnotations = yield select(selectedAnnotationsSelector);
  const selectedCategory = yield select(selectedCategorySelector);

  const updatedAnnotations = _.map(
    selectedAnnotations,
    (annotation: AnnotationType) => {
      return { ...annotation, categoryId: selectedCategory.id };
    }
  );

  const selectedAnnotation = yield select(selectedAnnotationSelector);
  if (!selectedAnnotation) return;

  yield put(
    imageViewerSlice.actions.setSelectedAnnotations({
      selectedAnnotations: updatedAnnotations,
      selectedAnnotation: {
        ...selectedAnnotation,
        categoryId: selectedCategory.id,
      },
    })
  );
}
