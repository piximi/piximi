import { put, select } from "redux-saga/effects";
import { compile, open, fit, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  fitOptionsSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";

export function* fitSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  const architectureOptions = yield select(architectureOptionsSelector);

  const classes = yield select(createdCategoriesCountSelector);

  const opened = yield open(architectureOptions, classes);

  yield put(classifierSlice.actions.updateOpened({ opened: opened }));

  const compileOptions = yield select(compileOptionsSelector);

  const compiled = yield compile(opened, compileOptions);

  yield put(classifierSlice.actions.updateCompiled({ compiled: compiled }));

  const images = yield select(categorizedImagesSelector);

  const categories = yield select(createdCategoriesSelector);

  const data = yield preprocess(images, categories);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
