import { LayersModel, data, Tensor, Rank } from "@tensorflow/tfjs";
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

import {
  Category,
  AlertType,
  SegmenterEvaluationResultType,
  AlertStateType,
  ImageType,
} from "types";
import { getStackTraceFromError } from "utils";

export function* evaluateSegmenterSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>): any {
  if (!execSaga) return;

  const model: LayersModel = yield select(segmenterFittedModelSelector);

  const validationImages: Array<ImageType> = yield select(
    segmenterValidationImagesSelector
  );

  yield put(yield put(applicationSlice.actions.hideAlertState({})));

  const categories: Array<Category> = yield select(
    annotationCategoriesSelector
  );

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
  const validationData: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }> = yield select(segmenterValDataSelector);

  try {
    var evaluationResult: SegmenterEvaluationResultType =
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