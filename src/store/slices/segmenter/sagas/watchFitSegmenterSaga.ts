import { takeLeading } from "redux-saga/effects";
import { fitSegmenterSaga } from "./fitSegmenterSaga";
import { segmenterSlice } from "store/slices/segmenter";

export function* watchFitSegmenterSaga() {
  yield takeLeading(
    segmenterSlice.actions.updateModelStatus.type,
    fitSegmenterSaga
  );
}
