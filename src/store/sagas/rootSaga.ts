import { all, fork } from "redux-saga/effects";
import { watchUploadImagesSaga } from "store/application";
import {
  watchEvaluateClassifierSaga,
  watchFitClassifierSaga,
  watchPredictClassifierSaga,
} from "store/classifier";
import {
  watchAnnotationStateChangeSaga,
  watchSelectedCategorySaga,
  watchActiveImageChangeSaga,
  watchActiveImageColorsChangeSaga,
} from "store/image-viewer";
import {
  watchFitSegmenterSaga,
  watchEvaluateSegmenterSaga,
  watchPredictSegmenterSaga,
} from "store/segmenter";

export function* rootSaga() {
  const classifierEffects = [
    fork(watchFitClassifierSaga),
    fork(watchPredictClassifierSaga),
    fork(watchEvaluateClassifierSaga),
  ];

  const applicationEffects = [fork(watchUploadImagesSaga)];

  const annotatorEffects = [
    fork(watchAnnotationStateChangeSaga),
    fork(watchSelectedCategorySaga),
    fork(watchActiveImageChangeSaga),
    fork(watchActiveImageColorsChangeSaga),
  ];

  const segmenterEffects = [
    fork(watchFitSegmenterSaga),
    fork(watchEvaluateSegmenterSaga),
    fork(watchPredictSegmenterSaga),
  ];

  yield all([
    ...classifierEffects,
    ...segmenterEffects,
    ...annotatorEffects,
    ...applicationEffects,
  ]);
}
