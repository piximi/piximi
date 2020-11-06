import { takeEvery } from "redux-saga/effects";
import { openSaga } from "./openSaga";
import { classifierSlice } from "../../slices";

export function* watchOpenSaga() {
  yield takeEvery(classifierSlice.actions.open.type, openSaga);
}
