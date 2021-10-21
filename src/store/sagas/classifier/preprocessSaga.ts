import { put, select } from "redux-saga/effects";
import { preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  createdCategoriesSelector,
  trainingPercentageSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";

export function* preprocessSaga(): any {
  const images = yield select(categorizedImagesSelector);

  const categories = yield select(createdCategoriesSelector);

  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);

  const data = yield preprocess(
    images,
    categories,
    architectureOptions.inputShape,
    rescaleOptions,
    trainingPercentage
  );

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
