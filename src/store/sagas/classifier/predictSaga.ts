import { put, select } from "redux-saga/effects";
import { open } from "../../coroutines/classifier";
import { classifierSlice, projectSlice } from "../../slices";
import {
  categoriesSelector,
  categorizedImagesSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  openedSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predictCategories } from "../../coroutines/classifier/predictCategories";
import { uncategorizedImagesSelector } from "../../selectors/uncategorizedImagesSelector";

export function* predictSaga(action: any): any {
  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  let opened = yield select(openedSelector);

  const categories = yield select(createdCategoriesSelector);

  const images = yield select(uncategorizedImagesSelector);

  const data = yield preprocess_predict(
    images,
    architectureOptions.inputShape,
    rescaleOptions
  );

  const { imageIds, categoryIds } = yield predictCategories(
    opened,
    data,
    categories
  ); //returns an array of Image ID and an array of corresponding categories ID

  yield put(
    projectSlice.actions.updateImagesCategories({
      ids: imageIds,
      categoryIds: categoryIds,
    })
  );
}
