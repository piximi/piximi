import { createListenerMiddleware } from "@reduxjs/toolkit";
import { ENV, enableDebugMode, History } from "@tensorflow/tfjs";
import { shuffle, take, takeRight } from "lodash";

import { classifierSlice } from "./classifierSlice";
import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data/dataSlice";

import {
  getStackTraceFromError,
  getSubset,
  logger,
} from "utils/common/helpers";
import { isUnknownCategory } from "store/data/helpers";

import {
  SimpleCNN,
  MobileNet,
  SequentialClassifier,
} from "utils/models/classification";
import { ModelStatus, Partition } from "utils/models/enums";
import { AlertType } from "utils/common/enums";

import { StoreListemerAPI, TypedAppStartListening } from "store/types";
import {
  FitOptions,
  OptimizerSettings,
  TrainingCallbacks,
} from "utils/models/types";
import { AlertState } from "utils/common/types";
import { Category, Kind, Thing } from "store/data/types";
import {
  availableClassificationModels,
  availableClassifierArchitectures,
} from "utils/models/availableClassificationModels";

export const classifierMiddleware = createListenerMiddleware();

const startAppListening =
  classifierMiddleware.startListening as TypedAppStartListening;

const handleError = async (
  listenerAPI: StoreListemerAPI,
  error: Error,
  name: string,
  kindId: Kind["id"],
  errorType?: { fittingError: boolean },
) => {
  const stackTrace = await getStackTraceFromError(error);
  const alertState: AlertState = {
    alertType: AlertType.Error,
    name: name,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };
  if (import.meta.env.NODE_ENV !== "production") {
    console.error(
      alertState.name,
      "\n",
      alertState.description,
      "\n",
      alertState.stackTrace,
    );
  }
  listenerAPI.dispatch(
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    }),
  );
  if (errorType && errorType.fittingError) {
    listenerAPI.dispatch(
      classifierSlice.actions.updateModelStatus({
        kindId,
        modelStatus: ModelStatus.Uninitialized,
        nameOrArch: name,
      }),
    );
  }
};

startAppListening({
  actionCreator: applicationSettingsSlice.actions.resetApplicationState,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(classifierSlice.actions.resetClassifiers());
  },
});

startAppListening({
  actionCreator: classifierSlice.actions.updateModelStatus,
  effect: async (action, listenerAPI) => {
    listenerAPI.unsubscribe();
    switch (action.payload.modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Training:
        await fitListener(
          action.payload.onEpochEnd,
          action.payload.nameOrArch,
          listenerAPI,
        );
        break;
      case ModelStatus.Predicting:
        await predictListener(listenerAPI, action.payload.nameOrArch);
        break;
      case ModelStatus.Evaluating:
        await evaluateListener(listenerAPI, action.payload.nameOrArch);
        break;
      default:
    }
    listenerAPI.subscribe();
  },
});

const fitListener = async (
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  nameOrArch: string | number,
  listenerAPI: StoreListemerAPI,
) => {
  import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "3" &&
    enableDebugMode();

  import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "2" &&
    logger(["tensorflow flags:", ENV.features]);

  const {
    classifier: classifierState,
    project: projectState,
    data: dataState,
  } = listenerAPI.getState();

  /* ACTIVE KIND */
  const activeKindId = projectState.activeKind;
  const activeKind = dataState.kinds.entities[activeKindId]!;
  if (!activeKind) return;
  /* CLASSIFIER  */
  const activeClassifier = classifierState.kindClassifiers[activeKindId];
  const modelIdx = activeClassifier.modelNameOrArch;
  let model: SequentialClassifier;
  if (typeof nameOrArch === "string") {
    model = availableClassificationModels[nameOrArch];
  } else {
    const modelName = `${activeKindId}_${["SimpleCNN", "MobileNet"][nameOrArch]}`;
    model = new availableClassifierArchitectures[nameOrArch](
      `${activeKindId}_${modelName}`,
    );
    availableClassificationModels[modelName] = model;
  }
  const modelInfo = activeClassifier.modelInfoDict[modelIdx];
  const modelStatus = modelInfo.status;
  const { optimizerSettings, preprocessSettings, inputShape } =
    modelInfo.params;

  const compileOptions = getSubset(optimizerSettings, [
    "learningRate",
    "lossFunction",
    "metrics",
    "optimizationAlgorithm",
  ]) as OptimizerSettings;
  const fitOptions = getSubset(optimizerSettings, [
    "batchSize",
    "epochs",
  ]) as FitOptions;

  /* DATA */

  const activeThingIds = activeKind.containing;

  const {
    unlabeledThings,
    labeledTraining,
    labeledValidation,
    labeledUnassigned,
  } = activeThingIds.reduce(
    (
      groupedThings: {
        unlabeledThings: Thing[];
        labeledTraining: Thing[];
        labeledValidation: Thing[];
        labeledUnassigned: Thing[];
      },
      id,
    ) => {
      const thing = dataState.things.entities[id];
      if (!thing) return groupedThings;
      if (isUnknownCategory(thing.categoryId)) {
        groupedThings.unlabeledThings.push(thing);
      } else if (thing.partition === Partition.Unassigned) {
        groupedThings.labeledUnassigned.push(thing);
      } else if (thing.partition === Partition.Training) {
        groupedThings.labeledTraining.push(thing);
      } else if (thing.partition === Partition.Validation) {
        groupedThings.labeledValidation.push(thing);
      }
      return groupedThings;
    },
    {
      unlabeledThings: [],
      labeledTraining: [],
      labeledValidation: [],
      labeledUnassigned: [],
    },
  );

  const categories: Array<Category> = [];
  const numClasses = activeKind.categories.reduce((count, id) => {
    const category = dataState.categories.entities[id];
    if (isUnknownCategory(id) || !category) return count;
    categories.push(category);
    return ++count;
  }, 0);

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId: activeKindId,
      modelStatus: ModelStatus.Loading,
      nameOrArch: model.name,
    }),
  );

  /* SEPARATE LABELED DATA INTO TRAINING AND VALIDATION */

  let splitLabeledTraining: Thing[] = [];
  let splitLabeledValidation: Thing[] = [];
  if (modelStatus === ModelStatus.InitFit) {
    const trainingThingsLength = Math.round(
      preprocessSettings.trainingPercentage * labeledUnassigned.length,
    );
    const validationThingsLength =
      labeledUnassigned.length - trainingThingsLength;

    const preparedLabeledUnassigned = preprocessSettings.shuffle
      ? shuffle(labeledUnassigned)
      : labeledUnassigned;

    splitLabeledTraining = take(
      preparedLabeledUnassigned,
      trainingThingsLength,
    );
    splitLabeledValidation = takeRight(
      preparedLabeledUnassigned,
      validationThingsLength,
    );
    listenerAPI.dispatch(
      dataSlice.actions.updateThings({
        updates: [
          ...splitLabeledTraining.map((thing) => ({
            id: thing.id,
            partition: Partition.Training,
          })),
          ...splitLabeledValidation.map((thing) => ({
            id: thing.id,
            partition: Partition.Validation,
          })),
          ...unlabeledThings.map((thing) => ({
            id: thing.id,
            partition: Partition.Inference,
          })),
        ],
      }),
    );
  } else {
    splitLabeledTraining = labeledUnassigned;
    listenerAPI.dispatch(
      dataSlice.actions.updateThings({
        updates: labeledUnassigned.map((thing) => ({
          id: thing.id,
          partition: Partition.Training,
        })),
      }),
    );
  }

  /* LOAD CLASSIFIER MODEL */

  try {
    if (model instanceof SimpleCNN) {
      (model as SimpleCNN).loadModel({
        inputShape,
        numClasses,
        randomizeWeights: preprocessSettings.shuffle,
        compileOptions,
      });
    } else if (model instanceof MobileNet) {
      await (model as MobileNet).loadModel({
        inputShape,
        numClasses,
        compileOptions,
        freeze: false,
        useCustomTopLayer: true,
      });
    } else {
      import.meta.env.NODE_ENV !== "production" &&
        import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
        console.warn("Unhandled architecture", model.name);
      return;
    }
  } catch (error) {
    handleError(
      listenerAPI,
      error as Error,
      "Failed to create tensorflow model",
      activeKindId,
      { fittingError: true },
    );
    return;
  }

  /* INJECT TRAINING AND VALIDATION DATA INTO MODEL */

  try {
    const loadDataArgs = {
      categories,
      inputShape,
      preprocessOptions: preprocessSettings,
      fitOptions,
    };
    model.loadTraining(
      [...labeledTraining, ...splitLabeledTraining],
      loadDataArgs,
    );
    model.loadValidation(
      [...labeledValidation, ...splitLabeledValidation],
      loadDataArgs,
    );
  } catch (error) {
    handleError(
      listenerAPI,
      error as Error,
      "Error in preprocessing",
      activeKindId,
      {
        fittingError: true,
      },
    );
    return;
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId: activeKindId,
      modelStatus: ModelStatus.Training,
      nameOrArch: model.name,
    }),
  );

  /* TRAIN MODEL */

  try {
    if (!onEpochEnd) {
      if (import.meta.env.NODE_ENV !== "production") {
        console.warn("Epoch end callback not provided");
      }
      onEpochEnd = async (epoch: number, logs: any) => {
        logger(`Epcoch: ${epoch}`);
        logger(logs);
      };
    }

    const history: History = await model.train(fitOptions, { onEpochEnd });
    import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      logger(history);
  } catch (error) {
    handleError(
      listenerAPI,
      error as Error,
      "Error training the model",
      activeKindId,
    );
    return;
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId: activeKindId,
      modelStatus: ModelStatus.Trained,
      nameOrArch: model.name,
    }),
  );
};

const predictListener = async (
  listenerAPI: StoreListemerAPI,
  modelName: string | number,
) => {
  const {
    data: dataState,
    classifier: classifierState,
    project: projectData,
  } = listenerAPI.getState();

  /* ACTIVE KIND */
  const activeKindId = projectData.activeKind;

  /* DATA */
  const activeKind = dataState.kinds.entities[activeKindId]!;
  if (!activeKind) return;
  const activeThingIds = activeKind.containing;
  const activeCategoryIds = activeKind.categories.filter(
    (id) => !isUnknownCategory(id),
  );
  const activeCategories = activeCategoryIds.map(
    (id) => dataState.categories.entities[id]!,
  );
  const inferenceThings = activeThingIds.reduce((things: Array<Thing>, id) => {
    const thing = dataState.things.entities[id];

    if (thing && thing.partition === Partition.Inference) {
      things.push(thing);
    }
    return things;
  }, []);

  /* CLASSIFIER */

  const activeClassifier = classifierState.kindClassifiers[activeKindId];
  const modelIdx = activeClassifier.modelNameOrArch;

  const model = availableClassificationModels[modelName];
  const modelInfo = activeClassifier.modelInfoDict[modelIdx];

  const {
    preprocessSettings: preprocessOptions,
    optimizerSettings,
    inputShape,
  } = modelInfo.params;
  const fitOptions = getSubset(optimizerSettings, [
    "batchSize",
    "epochs",
  ]) as FitOptions;
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
      "Failed to get tensorflow model",
      activeKindId,
    );
  }

  /* PREDICT CLASSIFIER */

  if (alertState) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({ alertState }),
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
          }),
        );
      }
      finalModelStatus = ModelStatus.Suggesting;
    } catch (error) {
      handleError(
        listenerAPI,
        error as Error,
        "Error in preprocessing the inference data",
        activeKindId,
      );
    }
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId: activeKindId,
      modelStatus: finalModelStatus,
      nameOrArch: model.name,
    }),
  );
};

const evaluateListener = async (
  listenerAPI: StoreListemerAPI,
  modelName: string | number,
) => {
  const { data: dataState, project: projectState } = listenerAPI.getState();

  listenerAPI.dispatch(applicationSettingsSlice.actions.hideAlertState());

  /* ACTIVE KIND */
  const activeKindId = projectState.activeKind;

  /* DATA */
  const activeKind = dataState.kinds.entities[activeKindId]!;
  if (!activeKind) return;
  const activeKnownCategoryCount = activeKind.categories.reduce((count, id) => {
    if (!isUnknownCategory(id)) {
      return ++count;
    }
    return count;
  }, 0);

  /* CLASSIFIER*/
  const model = availableClassificationModels[modelName];

  /* EVALUATE */

  if (!model.validationLoaded) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Validation set is empty",
          description: "Cannot evaluate model on empty validation set.",
        },
      }),
    );
  } else if (model.numClasses !== activeKnownCategoryCount) {
    listenerAPI.dispatch(
      applicationSettingsSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Warning,
          name: "The output shape of your model does not correspond to the number of categories!",
          description: `The trained model has an output shape of ${model.numClasses} but there are ${activeKnownCategoryCount} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
        },
      }),
    );
  } else {
    try {
      const evaluationResult = await model.evaluate();
      listenerAPI.dispatch(
        classifierSlice.actions.updateEvaluationResult({
          evaluationResult,
          kindId: activeKindId,
        }),
      );
    } catch (error) {
      handleError(
        listenerAPI,
        error as Error,
        "Error computing the evaluation results",
        activeKindId,
      );
      return;
    }
  }
  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId: activeKindId,
      modelStatus: ModelStatus.Trained,
      nameOrArch: model.name,
    }),
  );
};
