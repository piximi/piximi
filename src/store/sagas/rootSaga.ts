import { all, fork } from "redux-saga/effects";
//import { watchUploadImagesSaga } from "store/data";
import {
  watchEvaluateClassifierSaga,
  watchFitClassifierSaga,
  watchPredictClassifierSaga,
} from "store/classifier";
import {
  watchSelectedCategorySaga,
  //watchActiveImageChangeSaga,
  //watchActiveImageColorsChangeSaga,
} from "store/imageViewer";
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

  //const applicationEffects = [fork(watchUploadImagesSaga)];

  const imageViewerEffects = [
    fork(watchSelectedCategorySaga),
    //fork(watchActiveImageChangeSaga),
    //fork(watchActiveImageColorsChangeSaga),
  ];

  const segmenterEffects = [
    fork(watchFitSegmenterSaga),
    fork(watchEvaluateSegmenterSaga),
    fork(watchPredictSegmenterSaga),
  ];

  yield all([
    ...classifierEffects,
    ...segmenterEffects,
    ...imageViewerEffects,
    //...applicationEffects,
  ]);
}
