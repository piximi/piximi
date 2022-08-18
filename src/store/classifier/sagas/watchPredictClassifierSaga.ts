import { takeLeading } from "redux-saga/effects";

import { predictClassifierSaga } from "./predictClassifierSaga";

import { classifierSlice } from "store/classifier";

export function* watchPredictClassifierSaga(): any {
  yield takeLeading(
    classifierSlice.actions.predict.type,
    predictClassifierSaga
  );
}
