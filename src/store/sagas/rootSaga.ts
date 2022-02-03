import { all, fork } from "redux-saga/effects";
import {
  watchAnnotationStateChangeSaga,
  watchSelectedCategorySaga,
} from "./annotator";
import { watchFitSaga } from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";
import { watchEvaluateSaga } from "./classifier/watchEvaluateSaga";

export function* rootSaga() {
  const classifierEffects = [
    fork(watchFitSaga),
    fork(watchPredictSaga),
    fork(watchEvaluateSaga),
  ];

  const annotaterEffects = [
    fork(watchAnnotationStateChangeSaga),
    fork(watchSelectedCategorySaga),
  ];

  yield all([...classifierEffects, ...annotaterEffects]);
}
