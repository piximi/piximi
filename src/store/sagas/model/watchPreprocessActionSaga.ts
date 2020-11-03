import { takeEvery } from "redux-saga/effects";
import { preprocessSaga } from "./preprocessSaga";

export function* watchPreprocessActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", preprocessSaga);
}
