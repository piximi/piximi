import { takeLeading } from "redux-saga/effects";
import { fitSaga } from "./fitSaga";
import { classifierSlice } from "../../slices";

export function* watchFitSaga(): any {
  yield takeLeading(classifierSlice.actions.fit.type, fitSaga);
}
