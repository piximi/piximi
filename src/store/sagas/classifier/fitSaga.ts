import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { classifierSlice } from "../../slices";
import {
  compiledSelector,
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  fitOptionsSelector,
} from "../../selectors";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { trainImagesSelector } from "../../selectors/trainImagesSelector";
import { valImagesSelector } from "../../selectors/valImagesSelector";
import * as tensorflow from "@tensorflow/tfjs";
import { RescaleOptions } from "../../../types/RescaleOptions";
import { ArchitectureOptions } from "../../../types/ArchitectureOptions";
import { CompileOptions } from "../../../types/CompileOptions";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { FitOptions } from "../../../types/FitOptions";
import { ModelType } from "../../../types/ClassifierModelType";

export function* fitSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  const architectureOptions: ArchitectureOptions = yield select(
    architectureOptionsSelector
  );
  const classes: number = yield select(createdCategoriesCountSelector);

  var model: tensorflow.LayersModel;
  if (architectureOptions.selectedModel.modelType === ModelType.UserUploaded) {
    model = yield select(compiledSelector);
  } else {
    model = yield open(architectureOptions, classes);
  }

  const compileOptions: CompileOptions = yield select(compileOptionsSelector);
  const compiledModel: tensorflow.LayersModel = yield compile(
    model,
    compileOptions
  );

  yield put(
    classifierSlice.actions.updateCompiled({ compiled: compiledModel })
  );

  const categories: Category[] = yield select(createdCategoriesSelector);
  const trainImages: Image[] = yield select(trainImagesSelector);
  const valImages: Image[] = yield select(valImagesSelector);
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);

  const data = yield preprocess(
    trainImages,
    valImages,
    categories,
    architectureOptions.inputShape,
    rescaleOptions
  );

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));

  const options: FitOptions = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(
    compiledModel,
    data,
    options,
    onEpochEnd
  );

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}
