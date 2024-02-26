import { enableDebugMode, ENV, History } from "@tensorflow/tfjs";
import { PayloadAction } from "@reduxjs/toolkit";
import { shuffle, take, takeRight } from "lodash";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  selectClassifierCompileOptions,
  selectClassifierFitOptions,
  selectClassifierPreprocessOptions,
  selectClassifierTrainingPercentage,
  selectClassifierSelectedModel,
  selectClassifierInputShape,
} from "store/slices/classifier";
import { applicationSettingsSlice } from "store/slices/applicationSettings";

import {
  AlertStateType,
  AlertType,
  NEW_UNKNOWN_CATEGORY_ID,
  Partition,
} from "types";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

import { getStackTraceFromError } from "utils";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import {
  selectActiveCategories,
  selectActiveKnownCategoryCount,
  selectActiveLabeledThings,
  selectActiveThingsByPartition,
  selectActiveUnlabeledThings,
} from "store/slices/newData/selectors/reselectors";
import { NewImageType } from "types/ImageType";
import { NewAnnotationType } from "types/AnnotationType";
import { newDataSlice } from "store/slices/newData/newDataSlice";

function* assignDataPartitionsNew({
  preprocessOptions,
  labeledThings,
  unlabeledThings,
  trainingPercentage,
}: {
  preprocessOptions: ReturnType<typeof selectClassifierPreprocessOptions>;
  labeledThings: Array<NewImageType | NewAnnotationType>;
  unlabeledThings: Array<NewImageType | NewAnnotationType>;
  trainingPercentage: number;
}) {
  //first assign train and val partition to all categorized images
  const labeledThingIds = (
    preprocessOptions.shuffle ? shuffle(labeledThings) : labeledThings
  ).map((thing: NewImageType | NewAnnotationType) => {
    return thing.id;
  });

  //separate ids into train and val datasets
  const trainDataLength = Math.round(
    trainingPercentage * labeledThingIds.length
  );
  const valDataLength = labeledThingIds.length - trainDataLength;

  const trainDataIds = take(labeledThingIds, trainDataLength);
  const valDataIds = takeRight(labeledThingIds, valDataLength);

  yield put(
    newDataSlice.actions.updateThings({
      updates: [
        ...trainDataIds.map((id) => ({ id, partition: Partition.Training })),
        ...valDataIds.map((id) => ({ id, partition: Partition.Validation })),
        ...unlabeledThings.map((image) => ({
          id: image.id,
          partition: Partition.Inference,
        })),
      ],
      isPermanent: true,
    })
  );
}

function* loadClassifierNew({
  model,
  inputShape,
  preprocessOptions,
  compileOptions,
  fitOptions,
  numClasses,
}: {
  model: SequentialClassifier;
  inputShape: ReturnType<typeof selectClassifierInputShape>;
  preprocessOptions: ReturnType<typeof selectClassifierPreprocessOptions>;
  compileOptions: ReturnType<typeof selectClassifierCompileOptions>;
  fitOptions: ReturnType<typeof selectClassifierFitOptions>;
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
      yield (model as MobileNet).loadModel({
        inputShape,
        numClasses,
        compileOptions,
        freeze: false,
        useCustomTopLayer: true,
      });
    } else {
      // TODO - segmenter: do a block for UserUploadedModel
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "1" &&
        console.warn("Unhandled architecture", model.name);
      return false;
    }
  } catch (error) {
    yield handleErrorNew(error as Error, "Failed to create tensorflow model");
    return false;
  }

  const allCategories: ReturnType<typeof selectActiveCategories> = yield select(
    selectActiveCategories
  );
  const categories = allCategories.filter(
    (category) => category.id !== NEW_UNKNOWN_CATEGORY_ID
  );

  const partitionedThings: ReturnType<typeof selectActiveThingsByPartition> =
    yield select(selectActiveThingsByPartition);

  const trainingThings = partitionedThings[Partition.Training];
  const validationThings = partitionedThings[Partition.Validation];

  try {
    const loadDataArgs = {
      categories,
      inputShape,
      preprocessOptions,
      fitOptions,
    };
    model.loadTraining(trainingThings, loadDataArgs);
    model.loadValidation(validationThings, loadDataArgs);
  } catch (error) {
    yield handleErrorNew(error as Error, "Error in preprocessing");
    return false;
  }

  return true;
}

function* fitClassifierNew({
  model,
  onEpochEnd,
  fitOptions,
}: {
  model: SequentialClassifier;
  onEpochEnd?: TrainingCallbacks["onEpochEnd"];
  fitOptions: ReturnType<typeof selectClassifierFitOptions>;
}) {
  try {
    if (!onEpochEnd) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Epoch end callback not provided");
      }
      onEpochEnd = async (epoch: number, logs: any) => {
        console.log(`Epcoch: ${epoch}`);
        console.log(logs);
      };
    }
    var history: History = yield model.train(fitOptions, {
      onEpochEnd: onEpochEnd,
    });

    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.log(history);
  } catch (error) {
    yield handleErrorNew(error as Error, "Error in training the model");
    return;
  }

  yield put(
    classifierSlice.actions.updateModelStatusNew({
      execSaga: false,
      modelStatus: ModelStatus.Trained,
    })
  );
}

export function* fitClassifierSagaNew({
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
    typeof selectClassifierTrainingPercentage
  > = yield select(selectClassifierTrainingPercentage);

  const labeledThings: ReturnType<typeof selectActiveLabeledThings> =
    yield select(selectActiveLabeledThings);
  const unlabeledThings: ReturnType<typeof selectActiveUnlabeledThings> =
    yield select(selectActiveUnlabeledThings);

  const fitOptions: ReturnType<typeof selectClassifierFitOptions> =
    yield select(selectClassifierFitOptions);

  const preprocessOptions: ReturnType<
    typeof selectClassifierPreprocessOptions
  > = yield select(selectClassifierPreprocessOptions);

  const inputShape: ReturnType<typeof selectClassifierInputShape> =
    yield select(selectClassifierInputShape);

  const numClasses: ReturnType<typeof selectActiveKnownCategoryCount> =
    yield select(selectActiveKnownCategoryCount);

  const selectedModel: ReturnType<typeof selectClassifierSelectedModel> =
    yield select(selectClassifierSelectedModel);

  const compileOptions: ReturnType<typeof selectClassifierCompileOptions> =
    yield select(selectClassifierCompileOptions);

  // if Unititialized -> InitFit, then load first, else skip straight to training

  yield put(
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Loading,
    })
  );

  yield assignDataPartitionsNew({
    preprocessOptions,
    labeledThings,
    unlabeledThings,
    trainingPercentage,
  });

  const loaded: boolean = yield loadClassifierNew({
    model: selectedModel,
    inputShape,
    preprocessOptions,
    compileOptions,
    fitOptions,
    numClasses: numClasses,
  });
  console.log(
    "made it to FitClassifierSaga - FitClassifier - has loaded with return: ",
    loaded
  );
  if (!loaded) return;

  yield put(
    classifierSlice.actions.updateModelStatusNew({
      execSaga: false,
      modelStatus: ModelStatus.Training,
    })
  );

  yield fitClassifierNew({ model: selectedModel, onEpochEnd, fitOptions });
}

function* handleErrorNew(error: Error, errorName: string) {
  const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
    yield getStackTraceFromError(error);

  const alertState = {
    alertType: AlertType.Error,
    name: errorName,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  } as AlertStateType;

  if (process.env.NODE_ENV !== "production") {
    console.error(
      alertState.name,
      "\n",
      alertState.description,
      "\n",
      alertState.stackTrace
    );
  }

  yield put(
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );

  yield put(
    classifierSlice.actions.updateModelStatusNew({
      execSaga: false,
      modelStatus: ModelStatus.Uninitialized,
    })
  );
}
