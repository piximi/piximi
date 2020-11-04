import { put, select } from "redux-saga/effects";
import { compile } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import { openedSelector } from "../../selectors/openedSelector";

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(classifierSlice.actions.updateCompiled({ compiled: compiled }));
}
