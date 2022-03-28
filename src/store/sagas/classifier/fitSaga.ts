import { put, select } from "redux-saga/effects";
import { compile, fit, open, preprocess } from "../../coroutines/classifier";
import { applicationSlice, classifierSlice } from "../../slices";
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
import { ImageType } from "../../../types/ImageType";
import { FitOptions } from "../../../types/FitOptions";
import { ModelType } from "../../../types/ClassifierModelType";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";

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
    try {
      model = yield open(architectureOptions, classes);
    } catch (error) {
      yield handleError(error as Error, "Failed to create tensorflow model");
      return;
    }
  }

  const compileOptions: CompileOptions = yield select(compileOptionsSelector);

  var compiledModel: tensorflow.LayersModel;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(
    classifierSlice.actions.updateCompiled({ compiled: compiledModel })
  );

  const categories: Category[] = yield select(createdCategoriesSelector);
  const trainImages: ImageType[] = yield select(trainImagesSelector);
  const valImages: ImageType[] = yield select(valImagesSelector);
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);

  const options: FitOptions = yield select(fitOptionsSelector);

  try {
    var data = yield preprocess(
      trainImages,
      valImages,
      categories,
      architectureOptions.inputShape,
      rescaleOptions,
      options
    );
  } catch (error) {
    yield handleError(error as Error, "Error in preprocessing");
    return;
  }

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));

  try {
    var { fitted, status } = yield fit(
      compiledModel,
      data,
      options,
      onEpochEnd
    );
  } catch (error) {
    process.env.NODE_ENV === "development" && console.error(error);
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}

function* handleError(error: Error, errorName: string): any {
  const stackTrace = yield getStackTraceFromError(error);

  const alertState: AlertStateType = {
    alertType: AlertType.Error,
    name: errorName,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };

  yield put(
    applicationSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );

  yield put(
    classifierSlice.actions.updateFitting({
      fitting: false,
    })
  );
}
