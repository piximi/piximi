import { fit } from "@piximi/models";
import { put, select, takeEvery } from "redux-saga/effects";

import { fittedAction } from "../actions";
import {
  compiledSelector,
  dataSelector,
  fitOptionsSelector,
  validationDataSelector,
} from "../selectors";

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

export function* watchFitActionSaga() {
  yield takeEvery("CLASSIFIER_FIT", fitSaga);
}
