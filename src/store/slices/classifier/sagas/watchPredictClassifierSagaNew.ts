import { takeLeading } from "redux-saga/effects";

import { predictClassifierSagaNew } from "./predictClassifierSagaNew";

import { classifierSlice } from "store/slices/classifier";

export function* watchPredictClassifierSagaNew() {
  yield takeLeading(
    classifierSlice.actions.updateModelStatusNew.type,
    predictClassifierSagaNew
  );
}
