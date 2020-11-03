import { put, select } from "redux-saga/effects";
import {
  categoriesSelector,
  categorizedImagesSelector,
  trainingPercentageSelector,
  validationPercentageSelector,
} from "../selectors";
import { generatedAction, updateImagesPartitionsAction } from "../actions";
import { generate } from "../../store";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";

export function* generateSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(categoriesSelector);

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
