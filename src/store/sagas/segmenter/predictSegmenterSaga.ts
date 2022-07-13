import { put, select } from "redux-saga/effects";
import { applicationSlice, segmenterSlice, projectSlice } from "../../slices";
import { annotationCategoriesSelector } from "../../selectors";
import { Category } from "types/Category";
import { ImageType } from "types/ImageType";
import { LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";
import { preprocessSegmentationImages } from "store/coroutines";
import { Shape } from "types/Shape";
import { FitOptions } from "types/FitOptions";
import { PreprocessOptions } from "types/PreprocessOptions";
import {
  fittedSegmentationModelSelector,
  segmentationFitOptionsSelector,
  segmentationPreprocessOptionsSelector,
  segmentationInputShapeSelector,
  unannotatedImagesSelector,
} from "store/selectors/segmenter";
import { predictSegmentations } from "store/coroutines/segmenter";
import { Partition } from "types/Partition";
import { AnnotationType } from "types/AnnotationType";

export function* predictSegmenterSaga(action: any): any {
  const inferenceImages: Array<ImageType> = yield select(
    unannotatedImagesSelector
  );

  yield put(
    projectSlice.actions.updateSegmentationImagesPartition({
      ids: inferenceImages.map((image) => image.id),
      partition: Partition.Validation,
    })
  );

  const annotationCategories: Category[] = yield select(
    annotationCategoriesSelector
  );

  const inputShape: Shape = yield select(segmentationInputShapeSelector);

  const preprocessOptions: PreprocessOptions = yield select(
    segmentationPreprocessOptionsSelector
  );

  const fitOptions: FitOptions = yield select(segmentationFitOptionsSelector);

  let model = yield select(fittedSegmentationModelSelector);

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

  var predictedAnnotations: Array<{
    annotations: Array<AnnotationType>;
    imageId: string;
  }>;
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
