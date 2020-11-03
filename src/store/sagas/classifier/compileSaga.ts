import { put, select } from "redux-saga/effects";
import { openedSelector } from "../../selectors";
import { compile } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(classifierSlice.actions.updateCompiled({ compiled: compiled }));
}
