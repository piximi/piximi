import { takeEvery } from "redux-saga/effects";
import { classifierSlice } from "../../slices";
import { predictSaga } from "./predictSaga";

export function* watchPredictSaga(): any {
  yield takeEvery(classifierSlice.actions.predict.type, predictSaga);
}
