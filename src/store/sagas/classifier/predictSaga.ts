import { put, select } from "redux-saga/effects";
import { projectSlice } from "../../slices";
import { createdCategoriesSelector, openedSelector } from "../../selectors";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predictCategories } from "../../coroutines/classifier/predictCategories";
import { testImagesSelector } from "../../selectors/testImagesSelector";
import { fittedSelector } from "../../selectors/fittedSelector";

export function* predictSaga(action: any): any {
  const rescaleOptions = yield select(rescaleOptionsSelector);

  let model = yield select(fittedSelector);

  if (!model) {
    model = yield select(openedSelector);
  }

  if (!model) return;

  const categories = yield select(createdCategoriesSelector);

  const images = yield select(testImagesSelector);

  const data = yield preprocess_predict(images, rescaleOptions);

  const { imageIds, categoryIds } = yield predictCategories(
    model,
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
