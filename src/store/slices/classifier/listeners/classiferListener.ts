import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "types";

import { ModelStatus, availableClassifierModels } from "types/ModelType";
import { classifierSlice } from "../classifierSlice";
import { NewImageType } from "types/ImageType";
import { NewAnnotationType } from "types/AnnotationType";
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

export const classifierMiddleware = createListenerMiddleware();

export const startAppListening =
  classifierMiddleware.startListening as TypedAppStartListening;

const handleError = async (
  listenerAPI: ListenerEffectAPI<
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
  >,
  error: Error,
  name: string
) => {
  const stackTrace = await getStackTraceFromError(error);
  const alertState: AlertStateType = {
    alertType: AlertType.Error,
    name: name,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };
  listenerAPI.dispatch(
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
};

startAppListening({
  actionCreator: classifierSlice.actions.updateModelStatusNew,
  effect: async (action, listenerAPI) => {
    console.log("listening");
    if (action.payload.modelStatus !== ModelStatus.Predicting) return;

    const state = listenerAPI.getState();
    const activeKind = state.project.activeKind;
    const activeThingIds = getDeferredProperty(
      state.newData.kinds.entities[activeKind],
      "containing"
    );
    const activeCategorIds = getDeferredProperty(
      state.newData.kinds.entities[activeKind],
      "categories"
    ).filter((id) => id !== NEW_UNKNOWN_CATEGORY_ID);

    const activeCategories = activeCategorIds.map(
      (id) => getCompleteEntity(state.newData.categories.entities[id])!
    );

    const inferenceThings: Array<NewImageType | NewAnnotationType> = [];
    activeThingIds.forEach((id) => {
      const thing = getCompleteEntity(state.newData.things.entities[id]);

      if (thing && thing.partition === Partition.Inference) {
        inferenceThings.push(thing);
      }
    });

    const preprocessOptions = state.classifier.preprocessOptions;

    const fitOptions = state.classifier.fitOptions;

    const inputShape = state.classifier.inputShape;

    const modelIdx = state.classifier.selectedModelIdx;

    let model = availableClassifierModels[modelIdx];

    let finalModelStatus = ModelStatus.Trained;

    if (!inferenceThings.length) {
      listenerAPI.dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Info,
            name: "Inference set is empty",
            description: "No unlabeled images to predict.",
          },
        })
      );
    } else if (model.numClasses !== activeCategories.length) {
      listenerAPI.dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Warning,
            name: "The output shape of your model does not correspond to the number of categories!",
            description: `The trained model has an output shape of ${model.numClasses} but there are ${activeCategories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
          },
        })
      );
    } else if (!model.modelLoaded) {
      handleError(
        listenerAPI,
        new Error("No selectable model in store"),
        "Failed to get tensorflow model"
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
      } catch (error) {
        handleError(
          listenerAPI,
          error as Error,
          "Error in preprocessing the inference data"
        );
      }
      finalModelStatus = ModelStatus.Suggesting;
    }
    listenerAPI.unsubscribe();
    listenerAPI.dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: finalModelStatus,
        execSaga: false,
      })
    );
    listenerAPI.subscribe();
  },
});
