import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  categorizedImagesSelector,
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
} from "../../selectors";
import { fitOptionsSelector } from "../../selectors";
import { getMnistModel } from "../../../components/FitClassifierDialog/FitClassifierDialog/networks";

export function* fitSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  // const pathname =
  //     "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

  // const classes = yield select(createdCategoriesCountSelector);

  // const opened = yield open(pathname, classes);
  const opened = yield getMnistModel();

  const compileOptions = yield select(compileOptionsSelector);

  const compiled = yield compile(opened, compileOptions);

  const images = yield select(categorizedImagesSelector);

  const categories = yield select(createdCategoriesSelector);

  const data = yield preprocess(images, categories);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(compiled, data, options, onEpochEnd);
  debugger;

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
