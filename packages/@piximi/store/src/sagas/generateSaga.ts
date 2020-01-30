import {generate} from "@piximi/models";
import {put, select, takeEvery} from "redux-saga/effects";
import {Category, Image} from "@piximi/types";
import {generatedAction} from "../actions";
import {
  categoriesSelector,
  categorizedImagesSelector,
  generatorOptionsSelector
} from "../selectors";

export function* generateSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(categoriesSelector);

  const options = yield select(generatorOptionsSelector);

  const {data, validationData} = yield generate(images, categories, options);

  yield put(generatedAction({data: data, validationData: validationData}));
}

export function* watchGenerateActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", generateSaga);
}
