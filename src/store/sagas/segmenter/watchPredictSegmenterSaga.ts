import { takeLeading } from "redux-saga/effects";
import { segmenterSlice } from "../../slices";
import { predictSegmenterSaga } from "./predictSegmenterSaga";

export function* watchPredictSegmenterSaga(): any {
  yield takeLeading(
    segmenterSlice.actions.predictSegmenter.type,
    predictSegmenterSaga
  );
}
