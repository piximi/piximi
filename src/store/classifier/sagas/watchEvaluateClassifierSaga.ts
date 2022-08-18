import { takeLeading } from "redux-saga/effects";
import { evaluateClassifierSaga } from "./evaluateClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchEvaluateClassifierSaga(): any {
  yield takeLeading(
    classifierSlice.actions.evaluate.type,
    evaluateClassifierSaga
  );
}
