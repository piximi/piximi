import { takeLeading } from "redux-saga/effects";
import { fitSegmenterSaga } from "./fitSegmenterSaga";
import { segmenterSlice } from "store/segmenter";

export function* watchFitSegmenterSaga() {
  yield takeLeading(segmenterSlice.actions.fitSegmenter.type, fitSegmenterSaga);
}
