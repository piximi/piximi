import { all, fork } from "redux-saga/effects";
import { watchCompileActionSaga } from "./classifier";
import { watchFitActionSaga } from "./classifier";
import { watchPreprocessActionSaga } from "./classifier";
import { watchOpenActionSaga } from "./classifier";

export function* rootSaga() {
  const effects = [
    fork(watchCompileActionSaga),
    fork(watchFitActionSaga),
    fork(watchPreprocessActionSaga),
    fork(watchOpenActionSaga),
  ];

  yield all(effects);
}
