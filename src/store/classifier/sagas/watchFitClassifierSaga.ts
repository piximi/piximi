import { takeLeading } from "redux-saga/effects";
import { fitClassifierSaga } from "./fitClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchFitClassifierSaga(): any {
  yield takeLeading(classifierSlice.actions.fit.type, fitClassifierSaga);
}
