import { put, select } from "redux-saga/effects";
import { open } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  createdCategoriesCountSelector,
  openedSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predict } from "../../coroutines/classifier/predict";
import { uncategorizedImagesSelector } from "../../selectors/uncategorizedImagesSelector";

export function* predictSaga(action: any): any {
  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  let opened = yield select(openedSelector);

  const images = yield select(uncategorizedImagesSelector);

  const data = yield preprocess_predict(
    images,
    architectureOptions.inputShape,
    rescaleOptions
  );

  const ys = yield predict(opened, data);
  console.info(ys);
}
