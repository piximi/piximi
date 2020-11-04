import { put, select } from "redux-saga/effects";
import { fit } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import { compiledSelector } from "../../selectors/compiledSelector";
import { dataSelector } from "../../selectors/dataSelector";
import { fitOptionsSelector } from "../../selectors/fitOptionsSelector";
import { validationDataSelector } from "../../selectors/validationDataSelector";

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
