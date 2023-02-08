import { LayersModel, Tensor1D, Tensor4D, data } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import shuffle from "lodash/shuffle";
import { select, put } from "redux-saga/effects";

import { applicationSlice } from "store/application";

import {
  annotatedImagesSelector,
  projectSlice,
  annotationCategoriesSelector,
} from "store/project";
import {
  segmenterTrainingPercentageSelector,
  segmenterFitOptionsSelector,
  segmenterPreprocessOptionsSelector,
  segmenterArchitectureOptionsSelector,
  segmenterCompiledModelSelector,
  segmenterCompileOptionsSelector,
  segmenterSlice,
  segmenterTrainImagesSelector,
  segmenterValidationImagesSelector,
  createSegmentationModel,
  preprocessSegmentationImages,
  fitSegmenter,
} from "store/segmenter";
import { compile } from "store/common";
import {
  Partition,
  ModelType,
  AlertStateType,
  AlertType,
  ImageType,
} from "types";
import { getStackTraceFromError } from "utils";

export function* fitSegmenterSaga({
  payload: { onEpochEnd, execSaga },
}: PayloadAction<{
  onEpochEnd: any;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  const trainingPercentage: ReturnType<
    typeof segmenterTrainingPercentageSelector
  > = yield select(segmenterTrainingPercentageSelector);

  const annotatedImages: ReturnType<typeof annotatedImagesSelector> =
    yield select(annotatedImagesSelector);

  const fitOptions: ReturnType<typeof segmenterFitOptionsSelector> =
    yield select(segmenterFitOptionsSelector);

  const preprocessingOptions: ReturnType<
    typeof segmenterPreprocessOptionsSelector
  > = yield select(segmenterPreprocessOptionsSelector);

  // First assign train and val partition to all categorized images.
  const annotatedImagesIds = (
    preprocessingOptions.shuffle ? shuffle(annotatedImages) : annotatedImages
  ).map((image: ImageType) => {
    return image.id;
  });

  // Separate ids into train and val datasets.
  const trainDataLength = Math.round(
    trainingPercentage * annotatedImagesIds.length
  );
  const valDataLength = annotatedImagesIds.length - trainDataLength;

  const trainDataIds = annotatedImagesIds.splice(0, trainDataLength);
  const valDataIds = annotatedImagesIds.splice(-valDataLength, valDataLength);

  yield put(
    projectSlice.actions.updateSegmentationImagesPartition({
      ids: trainDataIds,
      partition: Partition.Training,
    })
  );

  yield put(
    projectSlice.actions.updateSegmentationImagesPartition({
      ids: valDataIds,
      partition: Partition.Validation,
    })
  );

  const architectureOptions: ReturnType<
    typeof segmenterArchitectureOptionsSelector
  > = yield select(segmenterArchitectureOptionsSelector);

  const annotationCategories: ReturnType<typeof annotationCategoriesSelector> =
    yield select(annotationCategoriesSelector);

  var model: LayersModel;
  if (architectureOptions.selectedModel.modelType === ModelType.UserUploaded) {
    model = yield select(segmenterCompiledModelSelector);
  } else {
    try {
      model = yield createSegmentationModel(
        architectureOptions,
        annotationCategories.length
      );
    } catch (error) {
      yield handleError(error as Error, "Failed to create tensorflow model");
      return;
    }
  }

  const compileOptions: ReturnType<typeof segmenterCompileOptionsSelector> =
    yield select(segmenterCompileOptionsSelector);

  var compiledModel: ReturnType<typeof compile>;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(segmenterSlice.actions.updateCompiled({ compiled: compiledModel }));

  const categories: ReturnType<typeof annotationCategoriesSelector> =
    yield select(annotationCategoriesSelector);

  const trainImages: ReturnType<typeof segmenterTrainImagesSelector> =
    yield select(segmenterTrainImagesSelector);
  const valImages: ReturnType<typeof segmenterValidationImagesSelector> =
    yield select(segmenterValidationImagesSelector);

  try {
    const trainData: Awaited<ReturnType<typeof preprocessSegmentationImages>> =
      (yield preprocessSegmentationImages(
        trainImages,
        categories,
        architectureOptions.inputShape,
        preprocessingOptions,
        fitOptions,
        "training"
      )) as data.Dataset<{
        xs: Tensor4D;
        ys: Tensor4D;
        id: Tensor1D;
      }>;

    const valData: Awaited<ReturnType<typeof preprocessSegmentationImages>> =
      (yield preprocessSegmentationImages(
        valImages,
        categories,
        architectureOptions.inputShape,
        preprocessingOptions,
        fitOptions,
        "validation"
      )) as data.Dataset<{
        xs: Tensor4D;
        ys: Tensor4D;
        id: Tensor1D;
      }>;

    var dataset = { train: trainData, val: valData };
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in preprocessing");
    return;
  }

  yield put(
    segmenterSlice.actions.updatePreprocessedSegmentationData({
      data: dataset,
    })
  );

  try {
    var {
      fitted,
      status: trainingHistory,
    }: Awaited<ReturnType<typeof fitSegmenter>> = yield fitSegmenter(
      compiledModel,
      dataset,
      fitOptions,
      onEpochEnd
    );
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  const payload = { fitted: fitted, trainingHistory: trainingHistory };

  yield put(segmenterSlice.actions.updateFitted(payload));
}

function* handleError(error: Error, errorName: string) {
  const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
    yield getStackTraceFromError(error);

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
    segmenterSlice.actions.updateFitting({
      fitting: false,
    })
  );
}
