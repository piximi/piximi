import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  kindClassifierModelDict,
  deleteClassifierModels,
  getDefaultModelInfo,
} from "utils/models/availableClassificationModels";

import { ModelStatus } from "utils/models/enums";

import {
  ClassifierEvaluationResultType,
  TrainingCallbacks,
} from "utils/models/types";
import { ClassifierState, ModelInfo } from "store/types";
import { Kind, Shape } from "store/data/types";
import { DEFAULT_KIND } from "store/data/constants";
import { getSelectedModelInfo } from "./utils";
import { RecursivePartial } from "utils/common/types";
import { recursiveAssign } from "utils/common/helpers";
import { cloneDeep } from "lodash";

export const initialState: ClassifierState = {
  kindClassifiers: {
    [DEFAULT_KIND]: {
      modelNameOrArch: 0,
      modelInfoDict: { "base-model": getDefaultModelInfo() },
    },
  },

  showClearPredictionsWarning: true,
};

export const classifierSlice = createSlice({
  name: "classifier",
  initialState: initialState,
  reducers: {
    resetClassifiers: (state) => {
      const kindsToDelete = Object.keys(state.kindClassifiers);
      deleteClassifierModels(kindsToDelete);
      return initialState;
    },
    setClassifier(
      state,
      action: PayloadAction<{ classifier: ClassifierState }>,
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.classifier;
      return action.payload.classifier;
    },
    setDefaults(state) {
      // TODO - segmenter: dispose() and state.selectedModel = SimpleCNN(), or whatever

      const kindsToDelete = Object.keys(state.kindClassifiers);
      deleteClassifierModels(kindsToDelete);

      state.kindClassifiers = {
        [DEFAULT_KIND]: {
          modelNameOrArch: 0,
          modelInfoDict: { "base-model": getDefaultModelInfo() },
        },
      };
    },
    updateKindClassifiers(
      state,
      action: PayloadAction<{
        changes: { add?: Array<Kind["id"]>; del?: Array<Kind["id"]> };
      }>,
    ) {
      const changes = action.payload.changes;
      if (changes.add) {
        changes.add.forEach(
          (kindId) =>
            (state.kindClassifiers[kindId] = {
              modelNameOrArch: 0,
              modelInfoDict: { "base-model": getDefaultModelInfo() },
            }),
        );
      }
      if (changes.del) {
        changes.del.forEach((kindId) => delete state.kindClassifiers[kindId]);
      }
    },
    updateModelStatus(
      state,
      action: PayloadAction<{
        modelStatus: ModelStatus;
        kindId: Kind["id"];
        onEpochEnd?: TrainingCallbacks["onEpochEnd"]; // used by fit
        nameOrArch: string | number;
      }>,
    ) {
      const { kindId, modelStatus } = action.payload;
      const selectedModelName = state.kindClassifiers[kindId].modelNameOrArch;
      if (selectedModelName) {
        const selectedModel =
          state.kindClassifiers[kindId].modelInfoDict[selectedModelName];
        selectedModel.status = modelStatus;
      }
    },

    updateModelOptimizerSettings(
      state,
      action: PayloadAction<{
        settings: Partial<ModelInfo["params"]["optimizerSettings"]>;
        kindId: Kind["id"];
      }>,
    ) {
      const { settings, kindId } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      Object.assign(selectedModelInfo.params.optimizerSettings, settings);
    },
    updateModelPreprocessOptions(
      state,
      action: PayloadAction<{
        settings: RecursivePartial<ModelInfo["params"]["preprocessSettings"]>;
        kindId: Kind["id"];
      }>,
    ) {
      const { settings, kindId } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      recursiveAssign(selectedModelInfo.params.preprocessSettings, settings);
    },
    updateInputShape(
      state,
      action: PayloadAction<{ inputShape: Shape; kindId: Kind["id"] }>,
    ) {
      const { kindId, inputShape } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      selectedModelInfo.params.inputShape = inputShape;
    },
    updateSelectedModelNameOrArch(
      state,
      action: PayloadAction<{
        modelName: string | number;
        kindId: Kind["id"];
      }>,
    ) {
      const { modelName, kindId } = action.payload;
      const classifier = state.kindClassifiers[kindId];
      classifier.modelNameOrArch = modelName;
      if (!modelName) return;
      if (!(modelName in classifier.modelInfoDict)) {
        classifier.modelInfoDict[modelName] = cloneDeep(
          classifier.modelInfoDict["base-model"],
        );
      }
    },
    loadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        kindId: Kind["id"];
        model: (typeof kindClassifierModelDict)[string][number];
      }>,
    ) {
      const { inputShape, kindId, model } = action.payload;

      for (const kindId of Object.keys(kindClassifierModelDict)) {
        kindClassifierModelDict[kindId].push(model);
      }
      const kindClassifier = state.kindClassifiers[kindId];
      const newModelIdx = kindClassifierModelDict[kindId].length - 1;

      kindClassifier.modelNameOrArch = newModelIdx;
      const uploadedModelInfo = getDefaultModelInfo();
      uploadedModelInfo.params.inputShape = inputShape;

      if (model.pretrained || model.history.epochs.length > 0) {
        uploadedModelInfo.status = ModelStatus.Trained;
      }
      kindClassifier.modelInfoDict[newModelIdx] = uploadedModelInfo;
    },
    updateEvaluationResult(
      state,
      action: PayloadAction<{
        evaluationResult: ClassifierEvaluationResultType;
        kindId: Kind["id"];
      }>,
    ) {
      const { evaluationResult, kindId } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );

      selectedModelInfo.evalResults = evaluationResult;
    },
    updateShowClearPredictionsWarning(
      state,
      action: PayloadAction<{ showClearPredictionsWarning: boolean }>,
    ) {
      state.showClearPredictionsWarning =
        action.payload.showClearPredictionsWarning;
    },
  },
});
