import { all, fork } from "redux-saga/effects";

import { watchCompileActionSaga } from "./compileSaga";
import { watchFitActionSaga } from "./fitSaga";
import { watchGenerateActionSaga } from "./generateSaga";
import { watchOpenActionSaga } from "./openSaga";

export function* root() {
  const effects = [
    fork(watchCompileActionSaga),
    fork(watchFitActionSaga),
    fork(watchGenerateActionSaga),
    fork(watchOpenActionSaga),
  ];

  yield all(effects);
}
