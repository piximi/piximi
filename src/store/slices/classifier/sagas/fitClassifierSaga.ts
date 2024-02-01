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
import {
  dataSlice,
  selectCreatedImageCategories,
  selectImagesByPartitions,
  selectCreatedImageCategoryCount,
  selectAllImages,
} from "store/slices/data";
import { applicationSettingsSlice } from "store/slices/applicationSettings";

import {
  AlertStateType,
  AlertType,
  ImageType,
  Partition,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "types";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

import { getStackTraceFromError } from "utils";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";

function* assignDataPartitions({
  preprocessOptions,
  categorizedImages,
  uncategorizedImages,
  trainingPercentage,
}: {
  preprocessOptions: ReturnType<typeof selectClassifierPreprocessOptions>;
  categorizedImages: Array<ImageType>;
  uncategorizedImages: Array<ImageType>;
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
    dataSlice.actions.updateImages({
      updates: [
        ...trainDataIds.map((id) => ({ id, partition: Partition.Training })),
        ...valDataIds.map((id) => ({ id, partition: Partition.Validation })),
        ...uncategorizedImages.map((image) => ({
          id: image.id,
          partition: Partition.Inference,
        })),
      ],
      isPermanent: true,
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
    yield handleError(error as Error, "Failed to create tensorflow model");
    return false;
  }

  const categories: ReturnType<typeof selectCreatedImageCategories> =
    yield select(selectCreatedImageCategories);

  const partitionSelector: ReturnType<typeof selectImagesByPartitions> =
    yield select(selectImagesByPartitions);
  const trainImages = partitionSelector([Partition.Training]);
  const valImages = partitionSelector([Partition.Validation]);

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
    yield handleError(error as Error, "Error in preprocessing");
    return false;
  }

  return true;
}

function* fitClassifier({
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
    yield handleError(error as Error, "Error in training the model");
    return;
  }

  yield put(
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Trained,
    })
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
    typeof selectClassifierTrainingPercentage
  > = yield select(selectClassifierTrainingPercentage);

  // const partitionSelector: ReturnType<typeof selectImagesByPartitions> =
  //   yield select(selectImagesByPartitions);
  // const categorizedImages = partitionSelector([
  //   Partition.Training,
  //   Partition.Validation,
  // ]);

  const images: ReturnType<typeof selectAllImages> = yield select(
    selectAllImages
  );

  const { categorizedImages, uncategorizedImages } = images.reduce(
    (
      sortedImages: {
        categorizedImages: ImageType[];
        uncategorizedImages: ImageType[];
      },
      image: ImageType
    ) => {
      if (image.categoryId === UNKNOWN_IMAGE_CATEGORY_ID) {
        sortedImages.uncategorizedImages.push(image);
      } else if (image.partition === Partition.Unassigned) {
        sortedImages.categorizedImages.push(image);
      }
      return sortedImages;
    },
    { categorizedImages: [], uncategorizedImages: [] }
  );

  const fitOptions: ReturnType<typeof selectClassifierFitOptions> =
    yield select(selectClassifierFitOptions);

  const preprocessOptions: ReturnType<
    typeof selectClassifierPreprocessOptions
  > = yield select(selectClassifierPreprocessOptions);

  const inputShape: ReturnType<typeof selectClassifierInputShape> =
    yield select(selectClassifierInputShape);

  const numClasses: number = yield select(selectCreatedImageCategoryCount);

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

  yield assignDataPartitions({
    preprocessOptions,
    categorizedImages,
    uncategorizedImages,
    trainingPercentage,
  });

  const loaded: boolean = yield loadClassifier({
    model: selectedModel,
    inputShape,
    preprocessOptions,
    compileOptions,
    fitOptions,
    numClasses,
  });

  if (!loaded) return;

  yield put(
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Training,
    })
  );

  yield fitClassifier({ model: selectedModel, onEpochEnd, fitOptions });
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
    classifierSlice.actions.updateModelStatus({
      execSaga: false,
      modelStatus: ModelStatus.Uninitialized,
    })
  );
}
