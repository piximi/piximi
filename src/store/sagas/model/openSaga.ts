import { put } from "redux-saga/effects";
import { openedModelAction } from "../../actions";
import { open } from "../../coroutines/model";

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(openedModelAction({ opened: opened }));
}
