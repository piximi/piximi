import { all, fork } from "redux-saga/effects";
import { watchCompileActionSaga } from "./watchCompileActionSaga";
import { watchFitActionSaga } from "./watchFitActionSaga";
import { watchGenerateActionSaga } from "./watchGenerateActionSaga";
import { watchOpenActionSaga } from "./watchOpenActionSaga";

export function* root() {
  const effects = [
    fork(watchCompileActionSaga),
    fork(watchFitActionSaga),
    fork(watchGenerateActionSaga),
    fork(watchOpenActionSaga),
  ];

  yield all(effects);
}
