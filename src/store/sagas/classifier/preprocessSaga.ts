import { put, select } from "redux-saga/effects";
import { preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import { createdCategoriesSelector } from "../../selectors";
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

  const data = yield preprocess(
    trainImages,
    valImages,
    categories,
    architectureOptions.inputShape,
    rescaleOptions
  );

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));
}
