import { takeLeading } from "redux-saga/effects";
import { evaluateSegmenterSaga } from "./evaluateSegmenterSaga";

import { segmenterSlice } from "store/segmenter";

export function* watchEvaluateSegmenterSaga() {
  yield takeLeading(
    segmenterSlice.actions.evaluateSegmenter.type,
    evaluateSegmenterSaga
  );
}
