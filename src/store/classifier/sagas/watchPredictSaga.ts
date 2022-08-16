import { takeLeading } from "redux-saga/effects";

import { predictSaga } from "./predictSaga";

import { classifierSlice } from "store/classifier";

export function* watchPredictSaga(): any {
  yield takeLeading(classifierSlice.actions.predict.type, predictSaga);
}
