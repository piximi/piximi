import { put, select } from "redux-saga/effects";
import {
  classifierSlice,
  applicationSlice,
  segmenterSlice,
} from "../../slices";
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
  segmentationInferenceImagesSelector,
  segmentationPreprocessOptionsSelector,
  segmentationInputShapeSelector,
} from "store/selectors/segmenter";
import { drawAnnotationsFromPredictedSegmentation } from "store/coroutines/segmenter";

export function* predictSegmenterSaga(action: any): any {
  const testImages: Array<ImageType> = yield select(
    segmentationInferenceImagesSelector
  );

  const categories: Category[] = yield select(annotationCategoriesSelector);

  const inputShape: Shape = yield select(segmentationInputShapeSelector);

  const preprocessOptions: PreprocessOptions = yield select(
    segmentationPreprocessOptionsSelector
  );

  const fitOptions: FitOptions = yield select(segmentationFitOptionsSelector);

  let model = yield select(fittedSegmentationModelSelector);

  if (!testImages.length) {
    applicationSlice.actions.updateAlertState({
      alertState: {
        alertType: AlertType.Info,
        name: "Inference set is empty",
        description: "No unlabeled images to predict.",
      },
    });
  } else {
    yield runSegmentationPrediction(
      testImages,
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
      model
    );
  }

  yield put(
    classifierSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runSegmentationPrediction(
  testImages: Array<ImageType>,
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
  const inferenceImages: Array<ImageType> = yield select(
    segmentationInferenceImagesSelector
  );
  try {
    data = yield preprocessSegmentationImages(
      testImages,
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

  try {
    yield drawAnnotationsFromPredictedSegmentation(
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
