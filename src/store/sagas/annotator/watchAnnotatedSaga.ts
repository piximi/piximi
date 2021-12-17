import { takeEvery } from "redux-saga/effects";
import { annotatedSaga } from "./annotatedSaga";
import { imageViewerSlice } from "../../slices";

export function* watchAnnotatedSaga() {
  yield takeEvery(imageViewerSlice.actions.setAnnotated, annotatedSaga);
}
