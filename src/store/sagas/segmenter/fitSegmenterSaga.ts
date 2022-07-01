import * as tensorflow from "@tensorflow/tfjs";
import _ from "lodash";
import { put, select } from "redux-saga/effects";
import { compile } from "store/coroutines";
import {
  applicationSlice,
  classifierSlice,
  projectSlice,
  segmenterSlice,
} from "store/slices";
import {
  compiledSelector,
  compileOptionsSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  fitOptionsSelector,
  preprocessOptionsSelector,
  trainingPercentageSelector,
} from "store/selectors";
import { architectureOptionsSelector } from "store/selectors/architectureOptionsSelector";
import { ArchitectureOptions } from "types/ArchitectureOptions";
import { CompileOptions } from "types/CompileOptions";
import { Category } from "types/Category";
import { ImageType } from "types/ImageType";
import { FitOptions } from "types/FitOptions";
import { ModelType } from "types/ModelType";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";
import { Partition } from "types/Partition";
import { PreprocessOptions } from "types/PreprocessOptions";
import { annotatedImagesSelector } from "store/selectors/segmenter/annotatedImagesSelector";
import {
  createSegmentationModel,
  preprocessSegmentationImages,
  fitSegmenter,
} from "store/coroutines";
import {
  segmentationTrainImagesSelector,
  segmentationValidationImagesSelector,
} from "store/selectors/segmenter";

export function* fitSegmenterSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  // TODO: select all information from the segmenter slice
  const trainingPercentage: number = yield select(trainingPercentageSelector);
  const annotatedImages: Array<ImageType> = yield select(
    annotatedImagesSelector
  );
  const fitOptions: FitOptions = yield select(fitOptionsSelector);
  const preprocessingOptions: PreprocessOptions = yield select(
    preprocessOptionsSelector
  );

  //first assign train and val partition to all categorized images
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

  const architectureOptions: ArchitectureOptions = yield select(
    architectureOptionsSelector
  );
  const classes: number = yield select(createdCategoriesCountSelector);

  var model: tensorflow.LayersModel;
  if (architectureOptions.selectedModel.modelType === ModelType.UserUploaded) {
    model = yield select(compiledSelector);
  } else {
    try {
      model = yield createSegmentationModel(architectureOptions, classes);
    } catch (error) {
      yield handleError(error as Error, "Failed to create tensorflow model");
      return;
    }
  }

  const compileOptions: CompileOptions = yield select(compileOptionsSelector);

  var compiledModel: tensorflow.LayersModel;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(segmenterSlice.actions.updateCompiled({ compiled: compiledModel }));

  // TODO: Select annotation categories
  const categories: Category[] = yield select(createdCategoriesSelector);

  const trainImages: ImageType[] = yield select(
    segmentationTrainImagesSelector
  );
  const valImages: ImageType[] = yield select(
    segmentationValidationImagesSelector
  );

  try {
    const trainData: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor<tensorflow.Rank.R4>;
      ys: tensorflow.Tensor<tensorflow.Rank.R4>;
    }> = yield preprocessSegmentationImages(
      trainImages,
      categories,
      architectureOptions.inputShape,
      preprocessingOptions,
      fitOptions
    );

    const valData: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor<tensorflow.Rank.R4>;
      ys: tensorflow.Tensor<tensorflow.Rank.R4>;
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
    classifierSlice.actions.updateFitting({
      fitting: false,
    })
  );
}
