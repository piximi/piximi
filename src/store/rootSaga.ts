import { all, fork } from "redux-saga/effects";
import {
  watchEvaluateClassifierSaga,
  watchFitClassifierSaga,
  watchPredictClassifierSaga,
} from "store/slices/classifier";
import { watchFitClassifierSagaNew } from "./slices/classifier/sagas/watchFitClassifierSagaNew";
import {
  watchFitSegmenterSaga,
  watchEvaluateSegmenterSaga,
  watchPredictSegmenterSaga,
} from "store/slices/segmenter";

export function* rootSaga() {
  const classifierEffects = [
    fork(watchFitClassifierSaga),
    fork(watchFitClassifierSagaNew),
    fork(watchPredictClassifierSaga),
    fork(watchEvaluateClassifierSaga),
  ];

  const segmenterEffects = [
    fork(watchFitSegmenterSaga),
    fork(watchEvaluateSegmenterSaga),
    fork(watchPredictSegmenterSaga),
  ];

  yield all([...classifierEffects, ...segmenterEffects]);
}
