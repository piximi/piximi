import { put, select } from "redux-saga/effects";
import { projectSlice } from "../../slices";
import { createdCategoriesSelector, openedSelector } from "../../selectors";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predictCategories } from "../../coroutines/classifier/predictCategories";
import { uncategorizedImagesSelector } from "../../selectors/uncategorizedImagesSelector";
import { fittedSelector } from "../../selectors/fittedSelector";

export function* predictSaga(action: any): any {
  const rescaleOptions = yield select(rescaleOptionsSelector);

  let fitted = yield select(fittedSelector);

  if (!fitted) return;

  const categories = yield select(createdCategoriesSelector);

  const images = yield select(uncategorizedImagesSelector);

  const data = yield preprocess_predict(images, rescaleOptions);

  const { imageIds, categoryIds } = yield predictCategories(
    fitted,
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
