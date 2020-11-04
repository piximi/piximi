import { put, select } from "redux-saga/effects";
import { fit } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import { compiledSelector } from "../../selectors";
import { dataSelector } from "../../selectors";
import { fitOptionsSelector } from "../../selectors";
import { validationDataSelector } from "../../selectors";

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

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
