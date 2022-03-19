import { takeLeading } from "redux-saga/effects";
import { classifierSlice } from "../../slices";
import { predictSaga } from "./predictSaga";

export function* watchPredictSaga(): any {
  yield takeLeading(classifierSlice.actions.predict.type, predictSaga);
}
