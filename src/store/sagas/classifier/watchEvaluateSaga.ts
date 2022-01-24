import { takeEvery } from "redux-saga/effects";
import { evaluateSaga } from "./evaluateSaga";
import { classifierSlice } from "../../slices";

export function* watchEvaluateSaga(): any {
  yield takeEvery(classifierSlice.actions.evaluate.type, evaluateSaga);
}
