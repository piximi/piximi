import { generate } from "@piximi/models";
import { put, select, takeEvery } from "redux-saga/effects";
import { Category, Image } from "@piximi/types";
import { generatedAction, updateImagesPartitionsAction } from "../actions";
import {
  categoriesSelector,
  categorizedImagesSelector,
  generatorOptionsSelector,
  trainingPercentageSelector,
  validationPercentageSelector,
} from "../selectors";

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

  const { data, validationData } = yield generate(images, categories);

  yield put(generatedAction({ data: data, validationData: validationData }));
}

export function* watchGenerateActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", generateSaga);
}
