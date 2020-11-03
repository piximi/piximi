import { put } from "redux-saga/effects";
import { open } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(classifierSlice.actions.updateOpened({ opened: opened }));
}
