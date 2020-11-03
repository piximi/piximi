import { put, select } from "redux-saga/effects";
import { openedSelector } from "../selectors";
import { compiledAction } from "../actions";
import { compile } from "../../store";

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(compiledAction({ compiled: compiled }));
}
