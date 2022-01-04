import { all, fork } from "redux-saga/effects";
import {
  watchAnnotationStateChangeSaga,
  watchSelectedCategorySaga,
} from "./annotator";
import { watchFitSaga } from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";

export function* rootSaga() {
  const classifierEffects = [fork(watchFitSaga), fork(watchPredictSaga)];

  const annotaterEffects = [
    fork(watchAnnotationStateChangeSaga),
    fork(watchSelectedCategorySaga),
  ];

  yield all([...classifierEffects, ...annotaterEffects]);
}
