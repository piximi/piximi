import { LayersModel, Tensor, data, Rank, GraphModel } from "@tensorflow/tfjs";
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
  predictSegmentationsFromGraph,
  preprocessSegmentationImages,
  segmenterModelSelector,
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
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  ObjectDetectionType,
  ModelType,
} from "types";
import { getStackTraceFromError } from "utils";
import CLASSES from "data/model-data/cocossd-classes";

export function* predictSegmenterSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>) {
  if (!execSaga) return;
  // inferenceImages: images from projectSlice that do not contain any annotations
  const inferenceImages: ReturnType<typeof unannotatedImagesSelector> =
    yield select(unannotatedImagesSelector);

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
    yield put(
      segmenterSlice.actions.updatePredicting({
        predicting: false,
      })
    );
    return;
  }

  // assign each of the inference images to the validation partition
  yield put(
    projectSlice.actions.updateSegmentationImagesPartition({
      ids: inferenceImages.map((image) => image.id),
      partition: Partition.Validation,
    })
  );

  //   annotationCategories: the annotation categories in the project slice
  const annotationCategories: ReturnType<typeof annotationCategoriesSelector> =
    yield select(annotationCategoriesSelector);
  const createdCategories = annotationCategories.filter((category) => {
    return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
  });
  const selectedModel: ReturnType<typeof segmenterModelSelector> = yield select(
    segmenterModelSelector
  );
  if (selectedModel.modelType === ModelType.CocoSSD) {
    // unused variables/imports
  }
  let possibleClasses: { [key: string]: ObjectDetectionType } = {};
  if (/*selectedModel.modelType === ModelType.CocoSSD*/ true) {
    possibleClasses = CLASSES;
  }
  const inputShape: ReturnType<typeof segmenterInputShapeSelector> =
    yield select(segmenterInputShapeSelector);

  // preprocessOption: {shuffle: true, rescaleOptions:{rescale:true, center: true}}
  const preprocessOptions: ReturnType<
    typeof segmenterPreprocessOptionsSelector
  > = yield select(segmenterPreprocessOptionsSelector);
  // fitOptions: {epochs: 10, batchSize:32, initialEpoch: 0}
  const fitOptions: ReturnType<typeof segmenterFitOptionsSelector> =
    yield select(segmenterFitOptionsSelector);
  // fitted Model
  let model: ReturnType<typeof segmenterFittedModelSelector> = yield select(
    segmenterFittedModelSelector
  );
  // Seems strange to have this considering this saga will only be executed if there is a fitted model
  if (model === undefined) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
    yield put(
      segmenterSlice.actions.updatePredicting({
        predicting: false,
      })
    );
    return;
  }

  yield runSegmentationPrediction(
    inferenceImages,
    annotationCategories,
    createdCategories,
    inputShape,
    preprocessOptions,
    fitOptions,
    model,
    possibleClasses
  );

  yield put(
    segmenterSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runSegmentationPrediction(
  inferenceImages: Array<ImageType>,
  categories: Array<Category>,
  createdCategories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  model: LayersModel | GraphModel,
  possibleClasses: { [key: string]: ObjectDetectionType }
) {
  var data: data.Dataset<{
    xs: Tensor<Rank.R3>;
    ys: Tensor<Rank.R3>;
    id: string;
  }>;
  try {
    data = yield preprocessSegmentationImages(
      inferenceImages,
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
      "inference"
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the inference data"
    );
    return;
  }

  if (data) {
    // bypass unused variable warning until used
  }
  var predictions: Awaited<ReturnType<typeof predictSegmentationsFromGraph>>;
  try {
    predictions = yield predictSegmentationsFromGraph(
      model as GraphModel,
      inferenceImages,
      createdCategories,
      possibleClasses
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error drawing the annotations on the inference images"
    );
    return;
  }
  const predictedAnnotations = predictions.annotations;
  const foundCategories = predictions.categories;
  console.log(foundCategories);
  var index = 0;
  while (index < foundCategories.length) {
    const foundCat = foundCategories[index];
    yield put(
      projectSlice.actions.createAnnotationCategory({
        name: foundCat.name,
        color: foundCat.color,
        id: foundCat.id,
      })
    );
    index++;
  }
  index = 0;
  while (index < predictedAnnotations.length) {
    yield put(
      projectSlice.actions.updateImageAnnotations({
        imageId: predictedAnnotations[index].imageId,
        annotations: predictedAnnotations[index].annotations,
      })
    );

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
