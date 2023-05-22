import { takeLeading } from "redux-saga/effects";

import { predictSegmenterSaga } from "./predictSegmenterSaga";

import { segmenterSlice } from "store/segmenter";

export function* watchPredictSegmenterSaga() {
  yield takeLeading(
    segmenterSlice.actions.updateModelStatus.type,
    predictSegmenterSaga
  );
}
