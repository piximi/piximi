import { takeLeading } from "redux-saga/effects";
import { fitClassifierSaga } from "./fitClassifierSaga";

import { classifierSlice } from "store/slices/classifier";

export function* watchFitClassifierSaga() {
  yield takeLeading(
    classifierSlice.actions.updateModelStatus.type,
    fitClassifierSaga
  );
}
