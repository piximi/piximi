import { LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";
import {
  projectSlice,
  annotationCategoriesSelector,
  unannotatedImagesSelector,
} from "store/project";
import {
  segmenterInputShapeSelector,
  segmenterPreprocessOptionsSelector,
  segmenterFitOptionsSelector,
  segmenterFittedModelSelector,
  segmenterSlice,
  predictSegmentations,
  preprocessSegmentationImages,
} from "store/segmenter";
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
import { getStackTraceFromError } from "utils";

export function* predictSegmenterSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>) {
  if (!execSaga) return;

  const inferenceImages: ReturnType<typeof unannotatedImagesSelector> =
    yield select(unannotatedImagesSelector);

  yield put(
    projectSlice.actions.updateSegmentationImagesPartition({
      ids: inferenceImages.map((image) => image.id),
      partition: Partition.Validation,
    })
  );

  const annotationCategories: ReturnType<typeof annotationCategoriesSelector> =
    yield select(annotationCategoriesSelector);

  const inputShape: ReturnType<typeof segmenterInputShapeSelector> =
    yield select(segmenterInputShapeSelector);

  const preprocessOptions: ReturnType<
    typeof segmenterPreprocessOptionsSelector
  > = yield select(segmenterPreprocessOptionsSelector);

  const fitOptions: ReturnType<typeof segmenterFitOptionsSelector> =
    yield select(segmenterFitOptionsSelector);

  let model: ReturnType<typeof segmenterFittedModelSelector> = yield select(
    segmenterFittedModelSelector
  );

  if (model === undefined) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
    return;
  }

  if (!inferenceImages.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Inference set is empty",
          description: "No unlabeled images to predict.",
        },
      })
    );
  } else {
    yield runSegmentationPrediction(
      inferenceImages,
      annotationCategories,
      inputShape,
      preprocessOptions,
      fitOptions,
      model
    );
  }

  yield put(
    segmenterSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runSegmentationPrediction(
  inferenceImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  model: LayersModel
) {
  var data: data.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R4>;
    id: Tensor<Rank.R1>;
  }>;
  try {
    data = yield preprocessSegmentationImages(
      inferenceImages,
      categories,
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

  var predictedAnnotations: Awaited<ReturnType<typeof predictSegmentations>>;
  try {
    predictedAnnotations = yield predictSegmentations(
      model,
      data,
      inferenceImages,
      categories
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error drawing the annotations on the inference images"
    );
    return;
  }

  var index = 0;
  while (index < predictedAnnotations.length) {
    const annotations = predictedAnnotations[index].annotations;
    if (annotations.length) {
      yield put(
        projectSlice.actions.updateImageAnnotations({
          imageId: predictedAnnotations[index].imageId,
          annotations: annotations,
        })
      );
    }
    index++;
  }

  yield put(
    segmenterSlice.actions.updatePredicted({
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
