import { LayersModel, Tensor, Rank } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";
import {
  classifierSlice,
  classifierFittedSelector,
  classifierValidationDataSelector,
  evaluateClassifier,
} from "store/classifier";
import { valImagesSelector } from "store/common";
import { createdCategoriesSelector } from "store/project";
import {
  AlertStateType,
  AlertType,
  Category,
  ClassifierEvaluationResultType,
  ImageType,
} from "types";
import { getStackTraceFromError } from "utils";

export function* evaluateClassifierSaga({
  payload: { execSaga },
}: PayloadAction<{
  execSaga: boolean;
}>): any {
  if (!execSaga) return;

  const model: LayersModel = yield select(classifierFittedSelector);
  const validationImages: Array<ImageType> = yield select(valImagesSelector);
  yield put(yield put(applicationSlice.actions.hideAlertState({})));

  const categories: Array<Category> = yield select(createdCategoriesSelector);

  const outputLayerSize = model.outputs[0].shape[1] as number;

  if (validationImages.length === 0) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Validation set is empty",
          description: "Cannot evaluate model on empty validation set.",
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
    yield runEvaluation(validationImages, model, categories);
  }

  yield put(
    classifierSlice.actions.updateEvaluating({
      evaluating: false,
    })
  );
}

function* runEvaluation(
  validationImages: Array<ImageType>,
  model: LayersModel,
  categories: Array<Category>
) {
  //@ts-ignore
  const validationData: Dataset<{
    xs: Tensor;
    ys: Tensor;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }> = yield select(classifierValidationDataSelector);

  try {
    var evaluationResult: ClassifierEvaluationResultType =
      yield evaluateClassifier(
        model,
        validationData,
        validationImages,
        categories
      );
  } catch (error) {
    yield handleError(error as Error, "Error computing the evaluation results");
    return;
  }

  yield put(
    classifierSlice.actions.updateEvaluationResult({
      evaluationResult,
    })
  );
}

function* handleError(error: Error, name: string): any {
  const stackTrace = yield getStackTraceFromError(error);

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
