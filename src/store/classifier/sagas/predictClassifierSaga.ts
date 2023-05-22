import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  classifierFitOptionsSelector,
  classifierPreprocessOptionsSelector,
  classifierSelectedModelSelector,
  classifierInputShapeSelector,
} from "store/classifier";
import { applicationSlice } from "store/application";
import {
  dataSlice,
  selectCreatedImageCategories,
  selectImagesByPartition,
} from "store/data";

import {
  AlertStateType,
  AlertType,
  Category,
  FitOptions,
  ImageType,
  Partition,
  PreprocessOptions,
  Shape,
} from "types";
import { ModelStatus } from "types/ModelType";

import { getStackTraceFromError } from "utils";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";

export function* predictClassifierSaga({
  payload: { modelStatus, execSaga },
}: PayloadAction<{ modelStatus: ModelStatus; execSaga: boolean }>) {
  if (modelStatus !== ModelStatus.Predicting || !execSaga) return;

  const testImages: ReturnType<typeof selectImagesByPartition> = yield select(
    (state) => selectImagesByPartition(state, Partition.Inference)
  );

  const categories: ReturnType<typeof selectCreatedImageCategories> =
    yield select(selectCreatedImageCategories);

  const preprocessOptions: ReturnType<
    typeof classifierPreprocessOptionsSelector
  > = yield select(classifierPreprocessOptionsSelector);

  const fitOptions: ReturnType<typeof classifierFitOptionsSelector> =
    yield select(classifierFitOptionsSelector);

  const inputShape: ReturnType<typeof classifierInputShapeSelector> =
    yield select(classifierInputShapeSelector);

  let model: ReturnType<typeof classifierSelectedModelSelector> = yield select(
    classifierSelectedModelSelector
  );

  let finalModelStatus = ModelStatus.Trained;

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
  } else if (model.numClasses !== categories.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Warning,
          name: "The output shape of your model does not correspond to the number of categories!",
          description: `The trained model has an output shape of ${model.numClasses} but there are ${categories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
        },
      })
    );
  } else if (!model.modelLoaded) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
  } else {
    yield runPrediction(
      testImages,
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
      model
    );
    finalModelStatus = ModelStatus.Suggesting;
  }

  yield put(
    classifierSlice.actions.updateModelStatus({
      modelStatus: finalModelStatus,
      execSaga: false,
    })
  );
}

function* runPrediction(
  testImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  model: SequentialClassifier
) {
  try {
    model.loadInference(testImages, {
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
    });
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the inference data"
    );
    return;
  }

  const imageIds = testImages.map((img) => img.id);
  const categoryIds: Awaited<ReturnType<typeof model.predict>> =
    yield model.predict(categories);

  yield put(
    dataSlice.actions.updateCategoriesOfImages({
      imageIds: imageIds,
      categoryIds: categoryIds,
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
