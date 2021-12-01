import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  compiledSelector,
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  dataSelector,
  fitOptionsSelector,
  openedSelector,
  trainingPercentageSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { trainImagesSelector } from "../../selectors/trainImagesSelector";
import { valImagesSelector } from "../../selectors/valImagesSelector";

export function* fitSaga(action: any): any {
  //TODO: there are some redundancies between fitSaga and openSaga/preprocessSaga. Should we be calling openSaga
  //or compileSaga or preprocessSaga prior to calling fitSaga?

  const { onEpochEnd } = action.payload;

  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);

  const classes = yield select(createdCategoriesCountSelector);

  let opened = yield select(openedSelector);

  if (!opened) {
    opened = yield open(architectureOptions, classes);
    yield put(classifierSlice.actions.updateOpened({ opened: opened }));
  }

  let compiled = yield select(compiledSelector);

  if (!compiled) {
    const compileOptions = yield select(compileOptionsSelector);

    compiled = yield compile(opened, compileOptions);

    yield put(classifierSlice.actions.updateCompiled({ compiled: compiled }));
  }

  let data = yield select(dataSelector);

  if (!data) {
    const categories = yield select(createdCategoriesSelector);

    const trainImages = yield select(trainImagesSelector);

    const valImages = yield select(valImagesSelector);

    data = yield preprocess(
      trainImages,
      valImages,
      categories,
      architectureOptions.inputShape,
      rescaleOptions,
      trainingPercentage
    );

    yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
  }

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
