import { takeLeading } from "redux-saga/effects";

import { predictClassifierSaga } from "./predictClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchClassifierPredictSaga(): any {
  yield takeLeading(
    classifierSlice.actions.predict.type,
    predictClassifierSaga
  );
}
