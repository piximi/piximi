import { all, fork } from "redux-saga/effects";
import {
  watchAnnotationStateChangeSaga,
  watchSelectedCategorySaga,
  watchActiveImageChangeSaga,
  watchActiveImageColorsChangeSaga,
} from "./annotator";
import { watchFitSaga } from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";
import { watchEvaluateSaga } from "./classifier/watchEvaluateSaga";
import { watchUploadImagesSaga } from "./application/watchUploadImagesSaga";

export function* rootSaga() {
  const classifierEffects = [
    fork(watchFitSaga),
    fork(watchPredictSaga),
    fork(watchEvaluateSaga),
  ];

  const applicationEffects = [fork(watchUploadImagesSaga)];

  const annotatorEffects = [
    fork(watchAnnotationStateChangeSaga),
    fork(watchSelectedCategorySaga),
    fork(watchActiveImageChangeSaga),
    fork(watchActiveImageColorsChangeSaga),
  ];

  yield all([...classifierEffects, ...annotatorEffects, ...applicationEffects]);
}
