import { takeEvery } from "redux-saga/effects";
import { fitSaga } from "./fitSaga";

export function* watchFitActionSaga() {
  yield takeEvery("CLASSIFIER_FIT", fitSaga);
}
