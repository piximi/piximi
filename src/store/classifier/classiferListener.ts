import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  AnnotatorState,
  AppSettingsState,
  ClassifierState,
  ImageViewerState,
  ProjectState,
  SegmenterState,
  TypedAppStartListening,
} from "store/types";
import { difference, intersection, shuffle, take, takeRight } from "lodash";

import { classifierSlice } from "./classifierSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { applicationSettingsSlice } from "store/applicationSettings";
import { CombinedState, ListenerEffectAPI } from "@reduxjs/toolkit";
import { DataState } from "store/types";
import { AppDispatch } from "store/types";
import { dataSlice } from "store/data/dataSlice";
import { ENV, enableDebugMode, History } from "@tensorflow/tfjs";
import {
  getStackTraceFromError,
  getSubset,
  isUnknownCategory,
} from "utils/common/helpers";
import { SimpleCNN } from "utils/models/SimpleCNN/SimpleCNN";
import { MobileNet } from "utils/models/MobileNet/MobileNet";
import { logger } from "utils/common/helpers";
import { CompileOptions, TrainingCallbacks } from "utils/models/types";
import { ModelStatus, Partition } from "utils/models/enums";
import { availableClassifierModels } from "utils/models/availableClassificationModels";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";
import { Category, Thing } from "store/data/types";

export const classifierMiddleware = createListenerMiddleware();

const startAppListening =
  classifierMiddleware.startListening as TypedAppStartListening;

type StoreListemerAPI = ListenerEffectAPI<
  CombinedState<{
    classifier: ClassifierState;
    segmenter: SegmenterState;
    imageViewer: ImageViewerState;
    project: ProjectState;
    applicationSettings: AppSettingsState;
    annotator: AnnotatorState;
    data: DataState;
  }>,
  AppDispatch,
  unknown
>;

const handleError = async (
  listenerAPI: StoreListemerAPI,
  error: Error,
  name: string,
  errorType?: { fittingError: boolean }
) => {
  const stackTrace = await getStackTraceFromError(error);
  const alertState: AlertState = {
    alertType: AlertType.Error,
    name: name,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };
  if (process.env.NODE_ENV !== "production") {
    console.error(
      alertState.name,
      "\n",
      alertState.description,
      "\n",
      alertState.stackTrace
    );
  }
  listenerAPI.dispatch(
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
  if (errorType && errorType.fittingError) {
    listenerAPI.dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Uninitialized,
      })
    );
  }
};

startAppListening({
  actionCreator: classifierSlice.actions.updateModelStatus,
  effect: async (action, listenerAPI) => {
    listenerAPI.unsubscribe();
    switch (action.payload.modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Training:
        await fitListener(action.payload.onEpochEnd, listenerAPI);
        break;
      case ModelStatus.Predicting:
        await predictListener(listenerAPI);
        break;
      case ModelStatus.Evaluating:
        await evaluateListener(listenerAPI);
        break;
      default:
    }
    listenerAPI.subscribe();
  },
});

const fitListener = async (
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  listenerAPI: StoreListemerAPI
) => {
  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "3" &&
    enableDebugMode();

  process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "2" &&
    logger(["tensorflow flags:", ENV.features]);

  const {
    classifier: classifierState,
    project: projectState,
    data: dataState,
  } = listenerAPI.getState();

  /* ACTIVE KIND */
  const activeKindId = projectState.activeKind;

  /* CLASSIFIER  */
  const { trainingPercentage, fitOptions, preprocessOptions, inputShape } =
    classifierState;
  const compileOptions = getSubset(classifierState, [
    "learningRate",
    "lossFunction",
    "metrics",
    "optimizationAlgorithm",
  ]) as CompileOptions;
  const modelIdx = classifierState.selectedModelIdx;

  let model = availableClassifierModels[modelIdx];

  /* DATA */

  const activeKind = getCompleteEntity(dataState.kinds.entities[activeKindId]);
  if (!activeKind) return;
  const activeThingIds = activeKind.containing;
  const unknownThingIds = getDeferredProperty(
    dataState.categories.entities[activeKind.unknownCategoryId],
    "containing"
  );
  let labeledThingIds = difference(activeThingIds, unknownThingIds);
  labeledThingIds = preprocessOptions.shuffle
    ? shuffle(labeledThingIds)
    : labeledThingIds;
  const unlabeledThingIds = intersection(activeThingIds, unknownThingIds);
  const categories: Array<Category> = [];
  const numClasses = activeKind.categories.reduce((count, id) => {
    const category = getCompleteEntity(dataState.categories.entities[id]);
    if (isUnknownCategory(id) || !category) return count;
    categories.push(category);
    return ++count;
  }, 0);

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Loading,
    })
  );

  /* SEPARATE LABELED DATA INTO TRAINING AND VALIDATION */

  const trainingThingsLength = Math.round(
    trainingPercentage * labeledThingIds.length
  );
  const validationThingsLength = labeledThingIds.length - trainingThingsLength;
  const trainingThingIds = take(labeledThingIds, trainingThingsLength);
  const validationThingIds = takeRight(labeledThingIds, validationThingsLength);
  const trainingThings: Array<Thing> = trainingThingIds.reduce(
    (things: Array<Thing>, id) => {
      const thing = getCompleteEntity(dataState.things.entities[id]);
      if (thing) things.push(thing);
      return things;
    },
    []
  );
  const validationThings: Array<Thing> = validationThingIds.reduce(
    (things: Array<Thing>, id) => {
      const thing = getCompleteEntity(dataState.things.entities[id]);
      if (thing) things.push(thing);
      return things;
    },
    []
  );

  listenerAPI.dispatch(
    dataSlice.actions.updateThings({
      updates: [
        ...trainingThingIds.map((id) => ({
          id,
          partition: Partition.Training,
        })),
        ...validationThingIds.map((id) => ({
          id,
          partition: Partition.Validation,
        })),
        ...unlabeledThingIds.map((id) => ({
          id,
          partition: Partition.Inference,
        })),
      ],
      isPermanent: true,
    })
  );

  /* LOAD CLASSIFIER MODEL */

  try {
    if (model instanceof SimpleCNN) {
      (model as SimpleCNN).loadModel({
        inputShape,
        numClasses,
        randomizeWeights: preprocessOptions.shuffle,
        compileOptions,
      });
    } else if (model instanceof MobileNet) {
      (model as MobileNet).loadModel({
        inputShape,
        numClasses,
        compileOptions,
        freeze: false,
        useCustomTopLayer: true,
      });
    } else {
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "1" &&
        console.warn("Unhandled architecture", model.name);
      return;
    }
  } catch (error) {
    handleError(
      listenerAPI,
      error as Error,
      "Failed to create tensorflow model",
      { fittingError: true }
    );
    return;
  }

  /* INJECT TRAINING AND VALIDATION DATA INTO MODEL */

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
    handleError(listenerAPI, error as Error, "Error in preprocessing", {
      fittingError: true,
    });
    return;
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Training,
    })
  );

  /* TRAIN MODEL */

  try {
    if (!onEpochEnd) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Epoch end callback not provided");
      }
      onEpochEnd = async (epoch: number, logs: any) => {
        logger(`Epcoch: ${epoch}`);
        logger(logs);
      };
    }

    var history: History = await model.train(fitOptions, { onEpochEnd });
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      logger(history);
  } catch (error) {
    handleError(listenerAPI, error as Error, "Error training the model");
    return;
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
    })
  );
};

const predictListener = async (listenerAPI: StoreListemerAPI) => {
  const {
    data: dataState,
    classifier: classifierState,
    project: projectData,
  } = listenerAPI.getState();

  /* ACTIVE KIND */
  const activeKindId = projectData.activeKind;

  /* DATA */
  const activeKind = getCompleteEntity(dataState.kinds.entities[activeKindId]);
  if (!activeKind) return;
  const activeThingIds = activeKind.containing;
  const activeCategoryIds = activeKind.categories.filter(
    (id) => !isUnknownCategory(id)
  );
  const activeCategories = activeCategoryIds.map(
    (id) => getCompleteEntity(dataState.categories.entities[id])!
  );
  const inferenceThings = activeThingIds.reduce((things: Array<Thing>, id) => {
    const thing = getCompleteEntity(dataState.things.entities[id]);

    if (thing && thing.partition === Partition.Inference) {
      things.push(thing);
    }
    return things;
  }, []);

  /* CLASSIFIER */

  const { preprocessOptions, fitOptions, inputShape } = classifierState;
  const modelIdx = classifierState.selectedModelIdx;
  let model = availableClassifierModels[modelIdx];
  let finalModelStatus = ModelStatus.Trained;

  /* CHECK FOR SIMPLE ERRORS */

  let alertState: AlertState | undefined = undefined;
  if (!inferenceThings.length) {
    alertState = {
      alertType: AlertType.Info,
      name: "Inference set is empty",
      description: "No unlabeled images to predict.",
    };
  } else if (model.numClasses !== activeCategories.length) {
    alertState = {
      alertType: AlertType.Warning,
      name: "The output shape of your model does not correspond to the number of categories!",
      description: `The trained model has an output shape of ${model.numClasses} but there are ${activeCategories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
    };
  } else if (!model.modelLoaded) {
    handleError(
      listenerAPI,
      new Error("No selectable model in store"),
      "Failed to get tensorflow model"
    );
  }

  /* PREDICT CLASSIFIER */

  if (alertState) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({ alertState })
    );
  } else {
    try {
      model.loadInference(inferenceThings, {
        categories: activeCategories,
        inputShape,
        preprocessOptions,
        fitOptions,
      });
      const thingIds = inferenceThings.map((thing) => thing.id);
      logger("before predict");
      const categoryIds = await model.predict(activeCategories);
      logger("after predict");
      if (thingIds.length === categoryIds.length) {
        listenerAPI.dispatch(
          dataSlice.actions.updateThings({
            updates: thingIds.map((thingId, idx) => ({
              id: thingId,
              categoryId: categoryIds[idx],
            })),
            isPermanent: true,
          })
        );
      }
      finalModelStatus = ModelStatus.Suggesting;
    } catch (error) {
      handleError(
        listenerAPI,
        error as Error,
        "Error in preprocessing the inference data"
      );
    }
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      modelStatus: finalModelStatus,
    })
  );
};

const evaluateListener = async (listenerAPI: StoreListemerAPI) => {
  const {
    data: dataState,
    classifier: classifierState,
    project: projectState,
  } = listenerAPI.getState();

  listenerAPI.dispatch(applicationSettingsSlice.actions.hideAlertState({}));

  /* ACTIVE KIND */
  const activeKindId = projectState.activeKind;

  /* DATA */
  const activeKind = getCompleteEntity(dataState.kinds.entities[activeKindId]);
  if (!activeKind) return;
  const activeKnownCategoryCount = activeKind.categories.reduce((count, id) => {
    if (!isUnknownCategory(id)) {
      return ++count;
    }
    return count;
  }, 0);

  /* CLASSIFIER*/
  const modelIdx = classifierState.selectedModelIdx;
  const model = availableClassifierModels[modelIdx];

  /* EVALUATE */

  if (!model.validationLoaded) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Validation set is empty",
          description: "Cannot evaluate model on empty validation set.",
        },
      })
    );
  } else if (model.numClasses !== activeKnownCategoryCount) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Warning,
          name: "The output shape of your model does not correspond to the number of categories!",
          description: `The trained model has an output shape of ${model.numClasses} but there are ${activeKnownCategoryCount} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
        },
      })
    );
  } else {
    try {
      const evaluationResult = await model.evaluate();
      listenerAPI.dispatch(
        classifierSlice.actions.updateEvaluationResult({
          evaluationResult,
        })
      );
    } catch (error) {
      handleError(
        listenerAPI,
        error as Error,
        "Error computing the evaluation results"
      );
      return;
    }
  }
  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
    })
  );
};
