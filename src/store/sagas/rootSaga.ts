import { all, fork } from "redux-saga/effects";
import { watchCompileActionSaga } from "./model";
import { watchFitActionSaga } from "./model";
import { watchPreprocessActionSaga } from "./model";
import { watchOpenActionSaga } from "./model";

export function* rootSaga() {
  const effects = [
    fork(watchCompileActionSaga),
    fork(watchFitActionSaga),
    fork(watchPreprocessActionSaga),
    fork(watchOpenActionSaga),
  ];

  yield all(effects);
}
