import { put, select } from "redux-saga/effects";
import { fit, open } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  createdCategoriesCountSelector,
  dataSelector,
  openedSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predict } from "../../coroutines/classifier/predict";

export function* predictSaga(action: any): any {
  const architectureOptions = yield select(architectureOptionsSelector);

  const rescaleOptions = yield select(rescaleOptionsSelector);

  const classes = yield select(createdCategoriesCountSelector);

  let opened = yield select(openedSelector);

  if (!opened) {
    opened = yield open(architectureOptions, classes);
    yield put(classifierSlice.actions.updateOpened({ opened: opened }));
  }

  const images = yield select(categorizedImagesSelector);

  const xs = yield preprocess_predict(
    images,
    architectureOptions.inputShape,
    rescaleOptions
  );

  const ys = yield predict(opened, xs);
  console.info(ys);
}
