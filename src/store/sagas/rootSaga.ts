import { all, fork } from "redux-saga/effects";
import { watchFitSaga } from "./classifier";
import { watchPredictSaga } from "./classifier/watchPredictSaga";

export function* rootSaga() {
  const effects = [fork(watchFitSaga), fork(watchPredictSaga)];

  yield all(effects);
}
