import { takeEvery } from "redux-saga/effects";

import { annotationStateChangeSaga } from "./annotationStateChangeSaga";

import { imageViewerSlice } from "store/image-viewer";

export function* watchAnnotationStateChangeSaga() {
  yield takeEvery(
    imageViewerSlice.actions.setAnnotationState,
    annotationStateChangeSaga
  );
}
