import { takeEvery } from "redux-saga/effects";
import { compileSaga } from "./compileSaga";

export function* watchCompileActionSaga() {
  yield takeEvery("CLASSIFIER_COMPILE", compileSaga);
}
