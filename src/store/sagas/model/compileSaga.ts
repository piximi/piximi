import { put, select } from "redux-saga/effects";
import { openedSelector } from "../../selectors";
import { compiledModelAction } from "../../actions";
import { compile } from "../../coroutines/model/compile";

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(compiledModelAction({ compiled: compiled }));
}
