import { createListenerMiddleware } from "@reduxjs/toolkit";

import { classifierSlice } from "./classifierSlice";
import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data/dataSlice";

import {
  getStackTraceFromError,
  getSubset,
  logger,
} from "utils/common/helpers";
import { isUnknownCategory } from "store/data/helpers";

import { ModelStatus, Partition } from "utils/models/enums";
import { AlertType } from "utils/common/enums";

import { StoreListemerAPI, TypedAppStartListening } from "store/types";
import { FitOptions } from "utils/models/types";
import { AlertState } from "utils/common/types";
import { Kind, Thing } from "store/data/types";
import { availableClassificationModels } from "utils/models/availableClassificationModels";

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

// startAppListening({
//   actionCreator: classifierSlice.actions.updateModelStatus,
//   effect: async (action, listenerAPI) => {
//     listenerAPI.unsubscribe();
//     switch (action.payload.modelStatus) {
//       case ModelStatus.InitFit:
//       case ModelStatus.Training:
//         await fitListener(
//           action.payload.onEpochEnd,
//           listenerAPI,
//           action.payload.nameOrArch as string,
//         );
//         break;
//       case ModelStatus.Predicting:
//         await predictListener(listenerAPI, action.payload.nameOrArch);
//         break;
//       case ModelStatus.Evaluating:
//         await evaluateListener(listenerAPI, action.payload.nameOrArch);
//         break;
//       default:
//     }
//     listenerAPI.subscribe();
//   },
// });

const predictListener = async (
  listenerAPI: StoreListemerAPI,
  modelName: string | number,
) => {
  const { data: dataState, project: projectData } = listenerAPI.getState();

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

  const model = availableClassificationModels[modelName];

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
      model.loadInference(inferenceThings, activeCategories);
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
