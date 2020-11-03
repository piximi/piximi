import { put, select } from "redux-saga/effects";
import {
  compiledSelector,
  dataSelector,
  fitOptionsSelector,
  validationDataSelector,
} from "../../selectors";
import { fit } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

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

  yield put(
    classifierSlice.actions.updateFitted({ fitted: fitted, status: status })
  );
}
