import { takeLeading } from "redux-saga/effects";
import { fitClassifierSagaNew } from "./fitClassifierSagaNew";

import { classifierSlice } from "store/slices/classifier";

export function* watchFitClassifierSagaNew() {
  yield takeLeading(
    classifierSlice.actions.updateModelStatusNew.type,
    fitClassifierSagaNew
  );
}
