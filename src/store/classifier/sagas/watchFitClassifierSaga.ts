import { takeLeading } from "redux-saga/effects";
import { fitClassifierSaga } from "./fitClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchFitClassifierSaga() {
  yield takeLeading(classifierSlice.actions.fit.type, fitClassifierSaga);
}
