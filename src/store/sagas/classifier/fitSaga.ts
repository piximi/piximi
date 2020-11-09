import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  createdCategoriesSelector,
} from "../../selectors";
import { fitOptionsSelector } from "../../selectors";

export function* fitSaga(action: any) {
  const { callback, classes, compileOptions, pathname, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  const compiled = yield compile(opened, compileOptions);

  const images = yield select(categorizedImagesSelector);

  const categories = yield select(createdCategoriesSelector);

  const data = yield preprocess(images, categories);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(compiled, data, options, callback);

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
