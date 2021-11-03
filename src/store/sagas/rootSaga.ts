import { all, fork } from "redux-saga/effects";
import { watchCompileSaga } from "./classifier";
import { watchFitSaga } from "./classifier";
import { watchPreprocessSaga } from "./classifier";
import { watchOpenSaga } from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";

export function* rootSaga() {
  const effects = [
    fork(watchCompileSaga),
    fork(watchFitSaga),
    fork(watchPredictSaga),
    fork(watchPreprocessSaga),
    fork(watchOpenSaga),
  ];

  yield all(effects);
}
