import { takeEvery } from "redux-saga/effects";
import { compileSaga } from "./compileSaga";
import { classifierSlice } from "../../slices";

export function* watchCompileSaga() {
  yield takeEvery(classifierSlice.actions.compile.type, compileSaga);
}
