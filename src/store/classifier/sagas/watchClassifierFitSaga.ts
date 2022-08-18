import { takeLeading } from "redux-saga/effects";
import { fitClassifierSaga } from "./fitClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchClassifierFitSaga(): any {
  yield takeLeading(classifierSlice.actions.fit.type, fitClassifierSaga);
}
