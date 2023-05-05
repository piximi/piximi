import { takeLeading } from "redux-saga/effects";
import { evaluateClassifierSaga } from "./evaluateClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchEvaluateClassifierSaga() {
  yield takeLeading(
    classifierSlice.actions.updateModelStatus.type,
    evaluateClassifierSaga
  );
}
