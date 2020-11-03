import { takeEvery } from "redux-saga/effects";
import { generateSaga } from "./generateSaga";

export function* watchGenerateActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", generateSaga);
}
