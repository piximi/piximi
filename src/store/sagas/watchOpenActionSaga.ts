import { takeEvery } from "redux-saga/effects";
import { openSaga } from "./openSaga";

export function* watchOpenActionSaga() {
  yield takeEvery("CLASSIFIER_OPEN", openSaga);
}
