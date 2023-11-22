import { takeLeading } from "redux-saga/effects";

import { predictClassifierSaga } from "./predictClassifierSaga";

import { classifierSlice } from "store/slices/classifier";

export function* watchPredictClassifierSaga() {
  yield takeLeading(
    classifierSlice.actions.updateModelStatus.type,
    predictClassifierSaga
  );
}
