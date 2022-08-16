import { takeLeading } from "redux-saga/effects";

import { predictSegmenterSaga } from "./predictSegmenterSaga";

import { segmenterSlice } from "store/segmenter";

export function* watchPredictSegmenterSaga(): any {
  yield takeLeading(
    segmenterSlice.actions.predictSegmenter.type,
    predictSegmenterSaga
  );
}
