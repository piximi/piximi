import { enableDebugMode, ENV } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
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
  ImageType,
  ModelType,
  Partition,
} from "types";

import { getStackTraceFromError } from "utils";

export function* fitClassifierSaga({
  payload: { onEpochEnd, execSaga },
}: PayloadAction<{
  onEpochEnd: any;
  execSaga: boolean;
}>) {
  if (!execSaga) return;

  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "3" &&
    enableDebugMode();

  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "2" &&
    console.log("tensorflow flags:", ENV.features);

  const trainingPercentage: ReturnType<
    typeof classifierTrainingPercentageSelector
  > = yield select(classifierTrainingPercentageSelector);

  const categorizedImages: ReturnType<typeof categorizedImagesSelector> =
    yield select(categorizedImagesSelector);

  const fitOptions: ReturnType<typeof classifierFitOptionsSelector> =
    yield select(classifierFitOptionsSelector);

  const preprocessingOptions: ReturnType<
    typeof classifierPreprocessOptionsSelector
  > = yield select(classifierPreprocessOptionsSelector);

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

  const architectureOptions: ReturnType<
    typeof classifierArchitectureOptionsSelector
  > = yield select(classifierArchitectureOptionsSelector);

  const classes: number = yield select(createdCategoriesCountSelector);

  var model: ReturnType<typeof classifierCompiledSelector>;
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

  if (model === undefined) {
    yield handleError(
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
    return;
  }

  const compileOptions: ReturnType<typeof classifierCompileOptionsSelector> =
    yield select(classifierCompileOptionsSelector);

  var compiledModel: ReturnType<typeof compile>;
  try {
    compiledModel = yield compile(model, compileOptions);
  } catch (error) {
    yield handleError(error as Error, "Failed to compile tensorflow model");
    return;
  }

  yield put(
    classifierSlice.actions.updateCompiled({ compiled: compiledModel })
  );

  const categories: ReturnType<typeof createdCategoriesSelector> = yield select(
    createdCategoriesSelector
  );
  const trainImages: ReturnType<typeof trainImagesSelector> = yield select(
    trainImagesSelector
  );
  const valImages: ReturnType<typeof valImagesSelector> = yield select(
    valImagesSelector
  );

  try {
    const trainData: Awaited<ReturnType<typeof preprocessClassifier>> =
      yield preprocessClassifier(
        trainImages,
        categories,
        architectureOptions.inputShape,
        preprocessingOptions,
        fitOptions
      );

    const valData: Awaited<ReturnType<typeof preprocessClassifier>> =
      yield preprocessClassifier(
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
    var { fitted, status }: Awaited<ReturnType<typeof fitClassifier>> =
      yield fitClassifier(compiledModel, data, fitOptions, onEpochEnd);
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  const payload = { fitted: fitted, status: status };

  yield put(classifierSlice.actions.updateFitted(payload));
}

function* handleError(error: Error, errorName: string) {
  const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
    yield getStackTraceFromError(error);

  const alertState = {
    alertType: AlertType.Error,
    name: errorName,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  } as AlertStateType;

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
