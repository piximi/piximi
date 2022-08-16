import { takeLeading } from "redux-saga/effects";
import { evaluateSaga } from "./evaluateSaga";

import { classifierSlice } from "store/classifier";

export function* watchEvaluateSaga(): any {
  yield takeLeading(classifierSlice.actions.evaluate.type, evaluateSaga);
}
