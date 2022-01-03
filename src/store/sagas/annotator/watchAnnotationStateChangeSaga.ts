import { takeEvery } from "redux-saga/effects";
import { annotationStateChangeSaga } from "./annotationStateChangeSaga";
import { imageViewerSlice } from "../../slices";

export function* watchAnnotationStateChangeSaga() {
  yield takeEvery(
    imageViewerSlice.actions.setAnnotationState,
    annotationStateChangeSaga
  );
}
