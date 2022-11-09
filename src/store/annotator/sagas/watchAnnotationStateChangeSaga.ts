import { takeEvery } from "redux-saga/effects";

import { annotationStateChangeSaga } from "./annotationStateChangeSaga";

import { AnnotatorSlice } from "store/annotator";

export function* watchAnnotationStateChangeSaga() {
  yield takeEvery(
    AnnotatorSlice.actions.setAnnotationState,
    annotationStateChangeSaga
  );
}
