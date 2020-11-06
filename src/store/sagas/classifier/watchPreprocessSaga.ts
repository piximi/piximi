import { takeEvery } from "redux-saga/effects";
import { preprocessSaga } from "./preprocessSaga";
import { classifierSlice } from "../../slices";

export function* watchPreprocessSaga() {
  yield takeEvery(classifierSlice.actions.preprocess.type, preprocessSaga);
}
