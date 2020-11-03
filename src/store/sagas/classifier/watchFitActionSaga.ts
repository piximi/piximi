import { takeEvery } from "redux-saga/effects";
import { fitSaga } from "./fitSaga";
import { classifierSlice } from "../../slices";

export function* watchFitActionSaga() {
  yield takeEvery(classifierSlice.actions.fit.type, fitSaga);
}
