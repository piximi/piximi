import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  fitOptionsSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { trainImagesSelector } from "../../selectors/trainImagesSelector";
import { valImagesSelector } from "../../selectors/valImagesSelector";

export function* fitSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  const classes = yield select(createdCategoriesCountSelector);

  const opened = yield open(architectureOptions, classes);
  yield put(classifierSlice.actions.updateOpened({ opened: opened }));

  const compileOptions = yield select(compileOptionsSelector);

  const compiled = yield compile(opened, compileOptions);

  yield put(classifierSlice.actions.updateCompiled({ compiled: compiled }));

  const categories = yield select(createdCategoriesSelector);

  const trainImages = yield select(trainImagesSelector);

  const valImages = yield select(valImagesSelector);

  const data = yield preprocess(
    trainImages,
    valImages,
    categories,
    architectureOptions.inputShape,
    rescaleOptions
  );

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
