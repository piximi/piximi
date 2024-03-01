import {
  CombinedState,
  ListenerEffectAPI,
  createListenerMiddleware,
} from "@reduxjs/toolkit";
import { AppDispatch } from "store/productionStore";
import {
  Annotator,
  ApplicationSettings,
  Classifier,
  Data,
  ImageViewer,
  Project,
  Segmenter,
  TypedAppStartListening,
} from "types";
import { NewDataState } from "types/NewData";
import { segmenterSlice } from "../segmenterSlice";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

export const segmenterMiddleware = createListenerMiddleware();

export const startAppListening =
  segmenterMiddleware.startListening as TypedAppStartListening;

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

startAppListening({
  actionCreator: segmenterSlice.actions.updateModelStatusNew,
  effect: async (action, listenerAPI) => {
    listenerAPI.unsubscribe();
    switch (action.payload.modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Training:
        fitListener(action.payload.onEpochEnd, listenerAPI);
        break;
    }
  },
});

const fitListener = async (
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  listenerAPI: StoreListemerAPI
) => {};
