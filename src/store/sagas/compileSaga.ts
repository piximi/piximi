import { compile } from "@piximi/models";
import { put, select, takeEvery } from "redux-saga/effects";

import { compiledAction } from "../actions";
import { openedSelector } from "../selectors";

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(compiledAction({ compiled: compiled }));
}

export function* watchCompileActionSaga() {
  yield takeEvery("CLASSIFIER_COMPILE", compileSaga);
}
