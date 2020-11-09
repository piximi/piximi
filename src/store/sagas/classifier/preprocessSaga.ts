import { put, select } from "redux-saga/effects";
import { preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  createdCategoriesSelector,
} from "../../selectors";

export function* preprocessSaga() {
  const images = yield select(categorizedImagesSelector);

  const categories = yield select(createdCategoriesSelector);

  const { data } = yield preprocess(images, categories);

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
