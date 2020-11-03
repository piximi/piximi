import { put, select } from "redux-saga/effects";
import {
  compiledSelector,
  dataSelector,
  fitOptionsSelector,
  validationDataSelector,
} from "../selectors";
import { fittedAction } from "../actions";
import { fit } from "../coroutines/fit";

export function* fitSaga(action: any) {
  const { callback } = action.payload;

  const compiled = yield select(compiledSelector);

  const data = yield select(dataSelector);

  const validationData = yield select(validationDataSelector);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(
    compiled,
    data,
    validationData,
    options,
    callback
  );

  yield put(fittedAction({ fitted: fitted, status: status }));
}
