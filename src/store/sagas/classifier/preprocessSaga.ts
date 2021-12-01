import { put, select } from "redux-saga/effects";
import { preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  createdCategoriesSelector,
  trainingPercentageSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { trainImagesSelector } from "../../selectors/trainImagesSelector";
import { valImagesSelector } from "../../selectors/valImagesSelector";

export function* preprocessSaga(): any {
  const trainImages = yield select(trainImagesSelector);

  const valImages = yield select(valImagesSelector);
  const categories = yield select(createdCategoriesSelector);

  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);

  const data = yield preprocess(
    trainImages,
    valImages,
    categories,
    architectureOptions.inputShape,
    rescaleOptions,
    trainingPercentage
  );

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
