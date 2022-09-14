import { LayersModel } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { select, put } from "redux-saga/effects";

import { applicationSlice } from "store/application";
import { annotationCategoriesSelector } from "store/project";
import {
  segmenterFittedModelSelector,
  segmenterValidationImagesSelector,
  segmenterSlice,
  segmenterValDataSelector,
  evaluateSegmenter,
} from "store/segmenter";

import { Category, AlertType, AlertStateType, ImageType } from "types";
import { getStackTraceFromError } from "utils";

export function* evaluateSegmenterSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>) {
  if (!execSaga) return;

  const model: ReturnType<typeof segmenterFittedModelSelector> = yield select(
    segmenterFittedModelSelector
  );

  if (model === undefined) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
    return;
  }

  const validationImages: ReturnType<typeof segmenterValidationImagesSelector> =
    yield select(segmenterValidationImagesSelector);

  yield put(applicationSlice.actions.hideAlertState({}));

  const categories: ReturnType<typeof annotationCategoriesSelector> =
    yield select(annotationCategoriesSelector);

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
  } else {
    yield runSegmentationEvaluation(validationImages, model, categories);
  }

  yield put(
    segmenterSlice.actions.updateEvaluating({
      evaluating: false,
    })
  );
}

function* runSegmentationEvaluation(
  validationImages: Array<ImageType>,
  model: LayersModel,
  categories: Array<Category>
) {
  const validationData: ReturnType<typeof segmenterValDataSelector> =
    yield select(segmenterValDataSelector);

  if (validationData === undefined) {
    yield handleError(
      new Error("No selectable validation data in store"),
      "Failed to get validation data"
    );
    return;
  }

  try {
    var evaluationResult: Awaited<ReturnType<typeof evaluateSegmenter>> =
      yield evaluateSegmenter(
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
    segmenterSlice.actions.updateSegmentationEvaluationResult({
      evaluationResult,
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
