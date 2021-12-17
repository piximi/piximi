import { all, fork } from "redux-saga/effects";
import { watchAnnotatedSaga, watchSelectedCategorySaga } from "./annotator";
import {
  watchCompileSaga,
  watchFitSaga,
  watchPreprocessSaga,
  watchOpenSaga,
} from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";

export function* rootSaga() {
  const classifierEffects = [
    fork(watchCompileSaga),
    fork(watchFitSaga),
    fork(watchPredictSaga),
    fork(watchPreprocessSaga),
    fork(watchOpenSaga),
  ];

  const annotaterEffects = [
    fork(watchAnnotatedSaga),
    fork(watchSelectedCategorySaga),
  ];

  yield all([...classifierEffects, ...annotaterEffects]);
}
