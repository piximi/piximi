import { put, select } from "redux-saga/effects";
import {
  createdCategoriesSelector,
  categorizedImagesSelector,
} from "../../selectors";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { preprocess } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

export function* preprocessSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(createdCategoriesSelector);

  const { data } = yield preprocess(images, categories);

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
