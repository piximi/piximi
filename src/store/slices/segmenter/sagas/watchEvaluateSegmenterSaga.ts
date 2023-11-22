import { takeLeading } from "redux-saga/effects";
import { evaluateSegmenterSaga } from "./evaluateSegmenterSaga";

import { segmenterSlice } from "store/slices/segmenter";

export function* watchEvaluateSegmenterSaga() {
  yield takeLeading(
    segmenterSlice.actions.updateModelStatus.type,
    evaluateSegmenterSaga
  );
}
