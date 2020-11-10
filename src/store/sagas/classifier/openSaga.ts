import { put } from "redux-saga/effects";
import { open } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";

export function* openSaga(action: any) {
  const { pathname, classes } = action.payload;

  const opened = yield open(pathname, classes);

  yield put(classifierSlice.actions.updateOpened({ opened: opened }));
}
