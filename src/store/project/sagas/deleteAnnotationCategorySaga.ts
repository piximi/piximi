import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { imagesSelector, setProjectImages } from "store/project";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";

export function* deleteAnnotationCategorySaga({
  payload: { categoryID, execSaga },
}: PayloadAction<{
  categoryID: string;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const images: ReturnType<typeof imagesSelector> = yield select(
    imagesSelector
  );

  for (let i = 0; i < images.length; i++) {
    for (let j = 0; j < images[i].annotations.length; j++) {
      if (images[i].annotations[j].categoryId === categoryID) {
        images[i].annotations[j].categoryId = UNKNOWN_ANNOTATION_CATEGORY_ID;
      }
    }
  }

  yield put(setProjectImages({ images: images }));
}
