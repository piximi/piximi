import { put, select } from "redux-saga/effects";
import {
  categoriesSelector,
  categorizedImagesSelector,
  trainingPercentageSelector,
  validationPercentageSelector,
} from "../../selectors";
import {
  preprocessedModelAction,
  updateImagesPartitionsAction,
} from "../../actions";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { preprocess } from "../../coroutines/model";

export function* preprocessSaga() {
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

  const { data } = yield preprocess(images, categories);

  yield put(preprocessedModelAction({ data: data }));
}
