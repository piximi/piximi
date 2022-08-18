import * as tensorflow from "@tensorflow/tfjs";
import _ from "lodash";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  classifierArchitectureOptionsSelector,
  classifierCompiledSelector,
  classifierCompileOptionsSelector,
  classifierFitOptionsSelector,
  classifierPreprocessOptionsSelector,
  classifierTrainingPercentageSelector,
  fitClassifier,
  createClassifierModel,
  preprocessClassifier,
} from "store/classifier";
import {
  categorizedImagesSelector,
  createdCategoriesCountSelector,
  createdCategoriesSelector,
  projectSlice,
  trainImagesSelector,
  valImagesSelector,
} from "store/project";
import { applicationSlice } from "store/application";
import { compile } from "store/common";

import {
  AlertStateType,
  AlertType,
  ArchitectureOptions,
  Category,
  CompileOptions,
  FitOptions,
  ImageType,
  ModelType,
  Partition,
  PreprocessOptions,
} from "types";

import { getStackTraceFromError } from "utils/getStackTrace";

export function* fitClassifierSaga(action: any): any {
  const { onEpochEnd } = action.payload;

  const trainingPercentage: number = yield select(
    classifierTrainingPercentageSelector
  );
  const categorizedImages: Array<ImageType> = yield select(
    categorizedImagesSelector
  );
  const fitOptions: FitOptions = yield select(classifierFitOptionsSelector);
  const preprocessingOptions: PreprocessOptions = yield select(
    classifierPreprocessOptionsSelector
  );

  //first assign train and val partition to all categorized images
  const categorizedImagesIds = (
    preprocessingOptions.shuffle
      ? _.shuffle(categorizedImages)
      : categorizedImages
  ).map((image: ImageType) => {
    return image.id;
  });

  //separate ids into train and val datasets
  const trainDataLength = Math.round(
    trainingPercentage * categorizedImagesIds.length
  );
  const valDataLength = categorizedImagesIds.length - trainDataLength;

  const trainDataIds = _.take(categorizedImagesIds, trainDataLength);
  const valDataIds = _.takeRight(categorizedImagesIds, valDataLength);

  yield put(
    projectSlice.actions.updateImagesPartition({
      ids: trainDataIds,
      partition: Partition.Training,
    })
  );

  yield put(
    projectSlice.actions.updateImagesPartition({
      ids: valDataIds,
      partition: Partition.Validation,
    })
  );

  const architectureOptions: ArchitectureOptions = yield select(
    classifierArchitectureOptionsSelector
  );
  const classes: number = yield select(createdCategoriesCountSelector);

  var model: tensorflow.LayersModel;
  if (architectureOptions.selectedModel.modelType === ModelType.UserUploaded) {
    model = yield select(classifierCompiledSelector);
  } else {
    try {
      model = yield createClassifierModel(architectureOptions, classes);
    } catch (error) {
      yield handleError(error as Error, "Failed to create tensorflow model");
      return;
    }
  }

  const compileOptions: CompileOptions = yield select(
    classifierCompileOptionsSelector
  );

  var compiledModel: tensorflow.LayersModel;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(
    classifierSlice.actions.updateCompiled({ compiled: compiledModel })
  );

  const categories: Category[] = yield select(createdCategoriesSelector);
  const trainImages: ImageType[] = yield select(trainImagesSelector);
  const valImages: ImageType[] = yield select(valImagesSelector);

  try {
    const trainData: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor<tensorflow.Rank.R4>;
      ys: tensorflow.Tensor<tensorflow.Rank.R2>;
      labels: tensorflow.Tensor<tensorflow.Rank.R1>;
      ids: tensorflow.Tensor<tensorflow.Rank.R1>;
    }> = yield preprocessClassifier(
      trainImages,
      categories,
      architectureOptions.inputShape,
      preprocessingOptions,
      fitOptions
    );

    const valData: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor<tensorflow.Rank.R4>;
      ys: tensorflow.Tensor<tensorflow.Rank.R2>;
      labels: tensorflow.Tensor<tensorflow.Rank.R1>;
      ids: tensorflow.Tensor<tensorflow.Rank.R1>;
    }> = yield preprocessClassifier(
      valImages,
      categories,
      architectureOptions.inputShape,
      preprocessingOptions,
      fitOptions
    );

    var data = { train: trainData, val: valData };
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in preprocessing");
    return;
  }

  yield put(classifierSlice.actions.updatePreprocessed({ data: data }));

  try {
    var { fitted, status } = yield fitClassifier(
      compiledModel,
      data,
      fitOptions,
      onEpochEnd
    );
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
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
