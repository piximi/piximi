import { createListenerMiddleware } from "@reduxjs/toolkit";
import { CompileOptions, TypedAppStartListening } from "types";
import { difference, intersection, shuffle, take, takeRight } from "lodash";

import { ModelStatus, availableClassifierModels } from "types/ModelType";
import { classifierSlice } from "../classifierSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import {
  AlertStateType,
  AlertType,
  Annotator,
  ApplicationSettings,
  Classifier,
  Data,
  ImageViewer,
  NEW_UNKNOWN_CATEGORY_ID,
  Partition,
  Project,
  Segmenter,
} from "types";
import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { getStackTraceFromError } from "utils";
import { CombinedState, ListenerEffectAPI } from "@reduxjs/toolkit";
import { NewDataState } from "types/NewData";
import { AppDispatch } from "store/productionStore";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { TrainingCallbacks } from "utils/common/models/Model";
import { ENV, enableDebugMode, History } from "@tensorflow/tfjs";
import { getSubset } from "utils/common/helpers";
import { ThingType } from "types/ThingType";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { NewCategory } from "types/Category";

export const classifierMiddleware = createListenerMiddleware();

export const startAppListening =
  classifierMiddleware.startListening as TypedAppStartListening;

type StoreListemerAPI = ListenerEffectAPI<
  CombinedState<{
    classifier: Classifier;
    segmenter: Segmenter;
    imageViewer: ImageViewer;
    project: Project;
    applicationSettings: ApplicationSettings;
    data: Data;
    annotator: Annotator;
    newData: NewDataState;
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
  const alertState: AlertStateType = {
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
      classifierSlice.actions.updateModelStatusNew({
        modelStatus: ModelStatus.Uninitialized,
      })
    );
  }
};

startAppListening({
  actionCreator: classifierSlice.actions.updateModelStatusNew,
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
    console.log("tensorflow flags:", ENV.features);

  const {
    classifier: classifierState,
    project: projectState,
    newData: dataState,
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
    dataState.categories.entities[NEW_UNKNOWN_CATEGORY_ID],
    "containing"
  );
  let labeledThingIds = difference(activeThingIds, unknownThingIds);
  labeledThingIds = preprocessOptions.shuffle
    ? shuffle(labeledThingIds)
    : labeledThingIds;
  const unlabeledThingIds = intersection(activeThingIds, unknownThingIds);
  const categories: Array<NewCategory> = [];
  const numClasses = activeKind.categories.reduce((count, id) => {
    const category = getCompleteEntity(dataState.categories.entities[id]);
    if (id === NEW_UNKNOWN_CATEGORY_ID || !category) return count;
    categories.push(category);
    return ++count;
  }, 0);

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatusNew({
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
  const trainingThings: Array<ThingType> = trainingThingIds.reduce(
    (things: Array<ThingType>, id) => {
      const thing = getCompleteEntity(dataState.things.entities[id]);
      if (thing) things.push(thing);
      return things;
    },
    []
  );
  const validationThings: Array<ThingType> = validationThingIds.reduce(
    (things: Array<ThingType>, id) => {
      const thing = getCompleteEntity(dataState.things.entities[id]);
      if (thing) things.push(thing);
      return things;
    },
    []
  );

  listenerAPI.dispatch(
    newDataSlice.actions.updateThings({
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
    classifierSlice.actions.updateModelStatusNew({
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
        console.log(`Epcoch: ${epoch}`);
        console.log(logs);
      };
    }

    var history: History = await model.train(fitOptions, { onEpochEnd });
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.log(history);
  } catch (error) {
    handleError(listenerAPI, error as Error, "Error training the model");
    return;
  }

  listenerAPI.dispatch(
    classifierSlice.actions.updateModelStatusNew({
      modelStatus: ModelStatus.Trained,
    })
  );
};

const predictListener = async (listenerAPI: StoreListemerAPI) => {
  const {
    newData: dataState,
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
    (id) => id !== NEW_UNKNOWN_CATEGORY_ID
  );
  const activeCategories = activeCategoryIds.map(
    (id) => getCompleteEntity(dataState.categories.entities[id])!
  );
  const inferenceThings = activeThingIds.reduce(
    (things: Array<ThingType>, id) => {
      const thing = getCompleteEntity(dataState.things.entities[id]);

      if (thing && thing.partition === Partition.Inference) {
        things.push(thing);
      }
      return things;
    },
    []
  );

  /* CLASSIFIER */

  const { preprocessOptions, fitOptions, inputShape } = classifierState;
  const modelIdx = classifierState.selectedModelIdx;
  let model = availableClassifierModels[modelIdx];
  let finalModelStatus = ModelStatus.Trained;

  /* CHECK FOR SIMPLE ERRORS */

  let alertState: AlertStateType | undefined = undefined;
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
      console.log("before predict");
      const categoryIds = await model.predict(activeCategories);
      console.log("after predict");
      if (thingIds.length === categoryIds.length) {
        listenerAPI.dispatch(
          newDataSlice.actions.updateThings({
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
    classifierSlice.actions.updateModelStatusNew({
      modelStatus: finalModelStatus,
    })
  );
};

const evaluateListener = async (listenerAPI: StoreListemerAPI) => {
  const {
    newData: dataState,
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
    if (id !== NEW_UNKNOWN_CATEGORY_ID) {
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
    classifierSlice.actions.updateModelStatusNew({
      modelStatus: ModelStatus.Trained,
    })
  );
};
