import { put } from "redux-saga/effects";
import { openedAction } from "../actions";
import { open } from "../coroutines/open";

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(openedAction({ opened: opened }));
}
