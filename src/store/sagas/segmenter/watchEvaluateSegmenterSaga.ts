import { takeLeading } from "redux-saga/effects";
import { evaluateSegmenterSaga } from "./evaluateSegmenterSaga";
import { segmenterSlice } from "../../slices";

export function* watchEvaluateSegmenterSaga(): any {
  yield takeLeading(
    segmenterSlice.actions.evaluateSegmenter.type,
    evaluateSegmenterSaga
  );
}
