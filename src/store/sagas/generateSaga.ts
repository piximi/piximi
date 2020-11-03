import { put, select } from "redux-saga/effects";
import {
  createdCategoriesSelector,
  categorizedImagesSelector,
  trainingPercentageSelector,
  validationPercentageSelector,
} from "../selectors";
import { generatedAction, updateImagesPartitionsAction } from "../actions";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import { generate } from "../coroutines/generate";

export function* generateSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(createdCategoriesSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);
  const validationPercentage = yield select(validationPercentageSelector);

  yield put(
    updateImagesPartitionsAction({
      trainingPercentage: trainingPercentage,
      validationPercentage: validationPercentage,
    })
  );

  const { data } = yield generate(images, categories);

  yield put(generatedAction({ data: data }));
}
