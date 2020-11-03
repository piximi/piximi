import { takeEvery } from "redux-saga/effects";
import { preprocessSaga } from "./preprocessSaga";
import { classifierSlice } from "../../slices";

export function* watchPreprocessActionSaga() {
  yield takeEvery(classifierSlice.actions.preprocess.type, preprocessSaga);
}
