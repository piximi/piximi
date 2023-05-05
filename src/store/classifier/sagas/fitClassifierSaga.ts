import { enableDebugMode, ENV, History } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { shuffle, take, takeRight } from "lodash";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  classifierCompileOptionsSelector,
  classifierFitOptionsSelector,
  classifierPreprocessOptionsSelector,
  classifierTrainingPercentageSelector,
  classifierSelectedModelSelector,
  classifierInputShapeSelector,
} from "store/classifier";
import {
  dataSlice,
  selectCreatedImageCategories,
  selectImagesByPartition,
  selectCreatedImageCategoryCount,
} from "store/data";
import { applicationSlice } from "store/application";

import { AlertStateType, AlertType, ImageType, Partition } from "types";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

import { getStackTraceFromError } from "utils";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";

function* assignDataPartitions({
  preprocessOptions,
  categorizedImages,
  trainingPercentage,
}: {
  preprocessOptions: ReturnType<typeof classifierPreprocessOptionsSelector>;
  categorizedImages: ReturnType<typeof selectImagesByPartition>;
  trainingPercentage: number;
}) {
  //first assign train and val partition to all categorized images
  const categorizedImagesIds = (
    preprocessOptions.shuffle ? shuffle(categorizedImages) : categorizedImages
  ).map((image: ImageType) => {
    return image.id;
  });

  //separate ids into train and val datasets
  const trainDataLength = Math.round(
    trainingPercentage * categorizedImagesIds.length
  );
  const valDataLength = categorizedImagesIds.length - trainDataLength;

  const trainDataIds = take(categorizedImagesIds, trainDataLength);
  const valDataIds = takeRight(categorizedImagesIds, valDataLength);

  yield put(
    dataSlice.actions.updateImagesPartition({
      imageIdsByPartition: {
        [Partition.Training]: trainDataIds,
        [Partition.Validation]: valDataIds,
      },
    })
  );
}

function* loadClassifier({
  model,
  inputShape,
  preprocessOptions,
  compileOptions,
  fitOptions,
  numClasses,
}: {
  model: ReturnType<typeof classifierSelectedModelSelector>;
  inputShape: ReturnType<typeof classifierInputShapeSelector>;
  preprocessOptions: ReturnType<typeof classifierPreprocessOptionsSelector>;
  compileOptions: ReturnType<typeof classifierCompileOptionsSelector>;
  fitOptions: ReturnType<typeof classifierFitOptionsSelector>;
  numClasses: number;
}) {
  try {
    if (model instanceof SimpleCNN) {
      yield (model as SimpleCNN).loadModel({
        inputShape,
        numClasses,
        randomizeWeights: preprocessOptions.shuffle,
        compileOptions,
      });
    } else if (model instanceof MobileNet) {
      // TODO - segmenter: useCustomTopLayer or not?
      yield (model as MobileNet).loadModel({
        inputShape,
        numClasses,
        compileOptions,
        freeze: false,
        useCustomTopLayer: true,
      });
    } else {
      // TODO - segmenter: do a block for UserUPloadedModel
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "1" &&
        console.warn("Unhandled architecture", model.name);
      return;
    }
  } catch (error) {
    yield handleError(error as Error, "Failed to create tensorflow model");
    return;
  }

  const categories: ReturnType<typeof selectCreatedImageCategories> =
    yield select(selectCreatedImageCategories);
  const trainImages: ReturnType<typeof selectImagesByPartition> = yield select(
    (state) => selectImagesByPartition(state, Partition.Training)
  );
  const valImages: ReturnType<typeof selectImagesByPartition> = yield select(
    (state) => selectImagesByPartition(state, Partition.Validation)
  );

  try {
    const loadDataArgs = {
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
    };
    model.loadTraining(trainImages, loadDataArgs);
    model.loadValidation(valImages, loadDataArgs);
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in preprocessing");
    return;
  }
}

function* fitClassifier({
  model,
  onEpochEnd,
  fitOptions,
}: {
  model: ReturnType<typeof classifierSelectedModelSelector>;
  onEpochEnd?: TrainingCallbacks["onEpochEnd"];
  fitOptions: ReturnType<typeof classifierFitOptionsSelector>;
}) {
  try {
    if (!onEpochEnd && process.env.NODE_ENV !== "production") {
      console.warn("Epoch end callback not provided");
    }
    var history: History = yield model.train(fitOptions, {
      onEpochEnd: onEpochEnd!,
    });
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(error);
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  yield put(
    // end model training: Training -> Trained
    classifierSlice.actions.updateFitted({ history })
  );
}

export function* fitClassifierSaga({
  payload: { modelStatus, onEpochEnd, execSaga },
}: PayloadAction<{
  onEpochEnd?: TrainingCallbacks["onEpochEnd"];
  execSaga: boolean;
  modelStatus: ModelStatus;
}>) {
  if (!execSaga) return;
  if (
    modelStatus !== ModelStatus.InitFit &&
    modelStatus !== ModelStatus.Training
  )
    return;

  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "3" &&
    enableDebugMode();

  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "2" &&
    console.log("tensorflow flags:", ENV.features);

  const trainingPercentage: ReturnType<
    typeof classifierTrainingPercentageSelector
  > = yield select(classifierTrainingPercentageSelector);

  const categorizedImages: ReturnType<typeof selectImagesByPartition> =
    yield select((state) =>
      selectImagesByPartition(state, Partition.Inference)
    );

  const fitOptions: ReturnType<typeof classifierFitOptionsSelector> =
    yield select(classifierFitOptionsSelector);

  const preprocessOptions: ReturnType<
    typeof classifierPreprocessOptionsSelector
  > = yield select(classifierPreprocessOptionsSelector);

  const inputShape: ReturnType<typeof classifierInputShapeSelector> =
    yield select(classifierInputShapeSelector);

  const numClasses: number = yield select(selectCreatedImageCategoryCount);

  const selectedModel: ReturnType<typeof classifierSelectedModelSelector> =
    yield select(classifierSelectedModelSelector);

  const compileOptions: ReturnType<typeof classifierCompileOptionsSelector> =
    yield select(classifierCompileOptionsSelector);

  // if Unititialized -> InitFit, then load first, else skip straight to traing
  if (modelStatus === ModelStatus.InitFit) {
    yield put(
      classifierSlice.actions.updateModelStatus({
        execSaga: false,
        modelStatus: ModelStatus.Loading,
      })
    );

    yield assignDataPartitions({
      preprocessOptions,
      categorizedImages,
      trainingPercentage,
    });

    yield loadClassifier({
      model: selectedModel,
      inputShape,
      preprocessOptions,
      compileOptions,
      fitOptions,
      numClasses,
    });

    yield put(
      classifierSlice.actions.updateModelStatus({
        execSaga: false,
        modelStatus: ModelStatus.Training,
      })
    );
  }

  yield fitClassifier({ model: selectedModel, onEpochEnd, fitOptions });

  yield put(
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Trained,
    })
  );
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
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Uninitialized,
    })
  );
}
