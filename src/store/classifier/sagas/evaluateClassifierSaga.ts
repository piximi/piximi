import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";
import {
  classifierSlice,
  selectClassifierSelectedModel,
} from "store/classifier";
import { selectCreatedImageCategories } from "store/data";
import { AlertStateType, AlertType } from "types";
import { getStackTraceFromError } from "utils";
import { ModelStatus } from "types/ModelType";

export function* evaluateClassifierSaga({
  payload: { execSaga, modelStatus },
}: PayloadAction<{
  execSaga: boolean;
  modelStatus: ModelStatus;
}>) {
  if (modelStatus !== ModelStatus.Evaluating || !execSaga) return;

  yield put(applicationSlice.actions.hideAlertState({}));

  const categories: ReturnType<typeof selectCreatedImageCategories> =
    yield select(selectCreatedImageCategories);
  yield put(applicationSlice.actions.hideAlertState({}));

  const model: ReturnType<typeof selectClassifierSelectedModel> = yield select(
    selectClassifierSelectedModel
  );

  if (!model.validationLoaded) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Validation set is empty",
          description: "Cannot evaluate model on empty validation set.",
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
  } else {
    let evaluationResult: Awaited<ReturnType<typeof model.evaluate>>;

    try {
      evaluationResult = yield model.evaluate();
    } catch (error) {
      yield handleError(
        error as Error,
        "Error computing the evaluation results"
      );
      return;
    }

    yield put(
      classifierSlice.actions.updateEvaluationResult({
        evaluationResult,
      })
    );
  }

  yield put(
    classifierSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
      execSaga: false,
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
