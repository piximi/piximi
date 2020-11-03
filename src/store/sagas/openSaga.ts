import { put } from "redux-saga/effects";
import { openedAction } from "../actions";
import { open } from "../../store";

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(openedAction({ opened: opened }));
}
