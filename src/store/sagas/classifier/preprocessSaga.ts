import { put, select } from "redux-saga/effects";
import {
  createdCategoriesSelector,
  categorizedImagesSelector,
  trainingPercentageSelector,
  validationPercentageSelector,
} from "../../selectors";
import { updateImagesPartitionsAction } from "../../actions";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { preprocess } from "../../coroutines/model";
import { classifierSlice } from "../../slices";

export function* preprocessSaga() {
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

  const { data } = yield preprocess(images, categories);

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
