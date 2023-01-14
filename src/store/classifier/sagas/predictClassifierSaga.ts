import { LayersModel } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  classifierArchitectureOptionsSelector,
  classifierFitOptionsSelector,
  classifierFittedSelector,
  classifierPreprocessOptionsSelector,
  predictClasses,
  preprocessClassifier,
  createClassificationLabels,
} from "store/classifier";
import {
  createdCategoriesSelector,
  projectSlice,
  testImagesSelector,
} from "store/project";
import { applicationSlice } from "store/application";

import {
  AlertStateType,
  AlertType,
  Category,
  FitOptions,
  ImageType,
  PreprocessOptions,
  Shape,
} from "types";

import { getStackTraceFromError } from "utils/getStackTrace";

export function* predictClassifierSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>) {
  if (!execSaga) return;

  const testImages: ReturnType<typeof testImagesSelector> = yield select(
    testImagesSelector
  );

  const categories: ReturnType<typeof createdCategoriesSelector> = yield select(
    createdCategoriesSelector
  );

  const architectureOptions: ReturnType<
    typeof classifierArchitectureOptionsSelector
  > = yield select(classifierArchitectureOptionsSelector);

  const preprocessOptions: ReturnType<
    typeof classifierPreprocessOptionsSelector
  > = yield select(classifierPreprocessOptionsSelector);

  const fitOptions: ReturnType<typeof classifierFitOptionsSelector> =
    yield select(classifierFitOptionsSelector);

  let model: ReturnType<typeof classifierFittedSelector> = yield select(
    classifierFittedSelector
  );

  if (model === undefined) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
    return;
  }

  const outputLayerSize = model.outputs[0].shape[1] as number;

  if (!testImages.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Inference set is empty",
          description: "No unlabeled images to predict.",
        },
      })
    );
  } else if (outputLayerSize !== categories.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Warning,
          name: "The output shape of your model does not correspond to the number of categories!",
          description: `The trained model has an output shape of ${outputLayerSize} but there are ${categories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
        },
      })
    );
  } else {
    yield runPrediction(
      testImages,
      categories,
      architectureOptions.inputShape,
      preprocessOptions,
      fitOptions,
      model
    );
  }

  yield put(
    classifierSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runPrediction(
  testImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  model: LayersModel
) {
  let dataSet: Awaited<ReturnType<typeof preprocessClassifier>>;
  try {
    const testLabels = createClassificationLabels(testImages, categories);

    dataSet = yield preprocessClassifier(
      testImages,
      testLabels,
      inputShape,
      preprocessOptions,
      fitOptions
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the inference data"
    );
    return;
  }

  try {
    var categoryIds: Awaited<ReturnType<typeof predictClasses>> =
      yield predictClasses(model, dataSet, categories); //returns an array of Image ID and an array of corresponding categories ID
  } catch (error) {
    yield handleError(error as Error, "Error predicting the inference data");
    return;
  }

  const imageIds = testImages.map((img) => img.id);

  yield put(
    projectSlice.actions.updateImagesCategories({
      ids: imageIds,
      categoryIds: categoryIds,
    })
  );

  yield put(
    classifierSlice.actions.updatePredicted({
      predicted: true,
    })
  );
}

function* handleError(error: Error, name: string) {
  const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
    yield getStackTraceFromError(error);

  const alertState: AlertStateType = {
    alertType: AlertType.Error,
    name: name,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };

  yield put(
    applicationSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
}
