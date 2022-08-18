import { LayersModel, Tensor, Rank } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import _ from "lodash";
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
  FitOptions,
  PreprocessOptions,
  Partition,
  SegmentationArchitectureOptions,
  Category,
  ModelType,
  CompileOptions,
  AlertStateType,
  AlertType,
  ImageType,
} from "types";
import { getStackTraceFromError } from "utils";

export function* fitSegmenterSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  const trainingPercentage: number = yield select(
    segmenterTrainingPercentageSelector
  );
  const annotatedImages: Array<ImageType> = yield select(
    annotatedImagesSelector
  );
  const fitOptions: FitOptions = yield select(segmenterFitOptionsSelector);
  const preprocessingOptions: PreprocessOptions = yield select(
    segmenterPreprocessOptionsSelector
  );

  // First assign train and val partition to all categorized images.
  const annotatedImagesIds = (
    preprocessingOptions.shuffle ? _.shuffle(annotatedImages) : annotatedImages
  ).map((image: ImageType) => {
    return image.id;
  });

  // Separate ids into train and val datasets.
  const trainDataLength = Math.round(
    trainingPercentage * annotatedImagesIds.length
  );
  const valDataLength = annotatedImagesIds.length - trainDataLength;

  const trainDataIds = _.take(annotatedImagesIds, trainDataLength);
  const valDataIds = _.takeRight(annotatedImagesIds, valDataLength);

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

  const architectureOptions: SegmentationArchitectureOptions = yield select(
    segmenterArchitectureOptionsSelector
  );

  const annotationCategories: Array<Category> = yield select(
    annotationCategoriesSelector
  );

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

  const compileOptions: CompileOptions = yield select(
    segmenterCompileOptionsSelector
  );

  var compiledModel: LayersModel;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(segmenterSlice.actions.updateCompiled({ compiled: compiledModel }));

  const categories: Category[] = yield select(annotationCategoriesSelector);

  const trainImages: ImageType[] = yield select(segmenterTrainImagesSelector);
  const valImages: ImageType[] = yield select(
    segmenterValidationImagesSelector
  );

  try {
    const trainData: Dataset<{
      xs: Tensor<Rank.R4>;
      ys: Tensor<Rank.R4>;
      id: Tensor<Rank.R1>;
    }> = yield preprocessSegmentationImages(
      trainImages,
      categories,
      architectureOptions.inputShape,
      preprocessingOptions,
      fitOptions
    );

    const valData: Dataset<{
      xs: Tensor<Rank.R4>;
      ys: Tensor<Rank.R4>;
      id: Tensor<Rank.R1>;
    }> = yield preprocessSegmentationImages(
      valImages,
      categories,
      architectureOptions.inputShape,
      preprocessingOptions,
      fitOptions
    );

    var dataset = { train: trainData, val: valData };
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in preprocessing");
    return;
  }

  yield put(
    segmenterSlice.actions.updatePreprocessedSegmentationData({ data: dataset })
  );

  try {
    var { fitted, status: trainingHistory } = yield fitSegmenter(
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

function* handleError(error: Error, errorName: string): any {
  const stackTrace = yield getStackTraceFromError(error);

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
