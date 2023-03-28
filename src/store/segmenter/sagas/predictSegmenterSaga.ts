import { LayersModel, Tensor, data, Rank, GraphModel } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";

import {
  DataSlice,
  selectUnannotatedImages,
  selectAnnotationCategories,
} from "store/data";
import {
  segmenterInputShapeSelector,
  segmenterPreprocessOptionsSelector,
  segmenterFitOptionsSelector,
  segmenterFittedModelSelector,
  segmenterSlice,
  preprocessSegmentationImages,
  segmenterModelSelector,
} from "store/segmenter";
import {
  AlertStateType,
  AlertType,
  Category,
  FitOptions,
  Partition,
  PreprocessOptions,
  Shape,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  ObjectDetectionType,
  ModelType,
  DecodedAnnotationType,
  ImageType,
} from "types";
import { getStackTraceFromError } from "utils";
import CLASSES from "data/model-data/cocossd-classes";
import {
  predictCoco,
  predictSegmentations,
  predictStardist,
} from "../coroutines";

export function* predictSegmenterSaga({
  payload: { execSaga },
}: PayloadAction<{ execSaga: boolean }>) {
  if (!execSaga) return;
  // inferenceImages: images from projectSlice that do not contain any annotations
  const inferenceImages: ReturnType<typeof selectUnannotatedImages> =
    yield select(selectUnannotatedImages);

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
    DataSlice.actions.updateSegmentationImagesPartition({
      imageIdsByPartition: {
        [Partition.Validation]: inferenceImages.map((image) => image.id),
      },
    })
  );

  //   annotationCategories: the annotation categories in the project slice
  const annotationCategories: ReturnType<typeof selectAnnotationCategories> =
    yield select(selectAnnotationCategories);
  const createdCategories = annotationCategories.filter((category) => {
    return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
  });
  const selectedModel: ReturnType<typeof segmenterModelSelector> = yield select(
    segmenterModelSelector
  );
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
    possibleClasses,
    selectedModel.modelType
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
  possibleClasses: { [key: string]: ObjectDetectionType },
  selectedModelType: ModelType
) {
  var predictions:
    | Awaited<ReturnType<typeof predictCoco>>
    | Awaited<ReturnType<typeof predictStardist>>
    | Awaited<ReturnType<typeof predictSegmentations>>;
  var predictedAnnotations: Array<{
    imageId: string;
    annotations: DecodedAnnotationType[];
  }>;
  var foundCategories: Category[];
  switch (selectedModelType) {
    case ModelType.CocoSSD:
      try {
        predictions = yield predictCoco(
          model as GraphModel,
          inferenceImages,
          createdCategories,
          possibleClasses
        ) as ReturnType<typeof predictCoco>;
        predictedAnnotations = predictions.annotations;
        foundCategories = predictions.categories;
      } catch (error) {
        yield handleError(
          error as Error,
          "Error drawing the annotations on the inference images"
        );
        return;
      }
      break;
    case ModelType.StardistVHE:
      try {
        predictions = yield predictStardist(
          model as GraphModel,
          inferenceImages,
          createdCategories
        );
        predictedAnnotations = predictions.annotations;
        foundCategories = predictions.categories;
      } catch (error) {
        yield handleError(
          error as Error,
          "Error drawing the annotations on the inference images"
        );
        return;
      }
      break;
    default:
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
      try {
        predictions = yield predictSegmentations(
          model as LayersModel,
          data,
          inferenceImages,
          createdCategories
        );
        predictedAnnotations = predictions.annotations;
        foundCategories = predictions.categories;
      } catch (error) {
        yield handleError(
          error as Error,
          "Error drawing the annotations on the inference images"
        );
        return;
      }
      break;
  }

  var index = 0;
  while (index < foundCategories.length) {
    const foundCat = foundCategories[index];
    yield put(
      DataSlice.actions.createAnnotationCategory({
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
      DataSlice.actions.updateImageAnnotations({
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
