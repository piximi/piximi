import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { getDefaultModelInfo } from "utils/models/availableClassificationModels";

import { ClassifierEvaluationResultType } from "utils/models/types";
import {
  ClassifierState,
  KindClassifier,
  ModelClassMap,
  ModelInfo,
} from "store/types";
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
    resetClassifiers: () => {
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
        changes:
          | {
              add: Array<Kind["id"]>;
              presetInfo?: Array<KindClassifier>;
            }
          | { del: Array<Kind["id"]> };
      }>,
    ) {
      const changes = action.payload.changes;
      if ("add" in changes) {
        changes.add.forEach(
          (kindId, idx) =>
            (state.kindClassifiers[kindId] =
              idx < changes.add.length &&
              changes.presetInfo &&
              changes.presetInfo[idx]
                ? changes.presetInfo[idx]
                : {
                    modelNameOrArch: 0,
                    modelInfoDict: { "base-model": getDefaultModelInfo() },
                  }),
        );
      } else {
        changes.del.forEach((kindId) => delete state.kindClassifiers[kindId]);
      }
    },
    addModelInfo(
      state,
      action: PayloadAction<{
        kindId: Kind["id"];
        modelName: string;
        modelInfo: ModelInfo;
      }>,
    ) {
      const { kindId, modelName, modelInfo } = action.payload;
      if (modelName in state.kindClassifiers[kindId].modelInfoDict) {
        throw new Error(
          `Info for model with name "${modelName}" already exists`,
        );
      }
      state.kindClassifiers[kindId].modelInfoDict[modelName] = modelInfo;
    },
    removeModelInfo(
      state,
      action: PayloadAction<{
        kindId: Kind["id"];
        modelName: string;
      }>,
    ) {
      const { kindId, modelName } = action.payload;
      if (!(modelName in state.kindClassifiers[kindId].modelInfoDict)) {
        throw new Error(
          `Info for model with name "${modelName}" does not exists`,
        );
      }
      delete state.kindClassifiers[kindId].modelInfoDict[modelName];
    },
    addModelClassMapping(
      state,
      action: PayloadAction<{
        kindId: Kind["id"];
        modelName: string;
        classMapping: ModelClassMap;
      }>,
    ) {
      const { kindId, modelName, classMapping } = action.payload;
      if (!(modelName in state.kindClassifiers[kindId].modelInfoDict)) {
        throw new Error(
          `Info for model with name "${modelName}" does not exists`,
        );
      }
      state.kindClassifiers[kindId].modelInfoDict[modelName].classMap =
        classMapping;
    },
    updateModelOptimizerSettings(
      state,
      action: PayloadAction<{
        settings: Partial<ModelInfo["optimizerSettings"]>;
        kindId: Kind["id"];
      }>,
    ) {
      const { settings, kindId } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      Object.assign(selectedModelInfo.optimizerSettings, settings);
    },
    updateModelPreprocessOptions(
      state,
      action: PayloadAction<{
        settings: RecursivePartial<ModelInfo["preprocessSettings"]>;
        kindId: Kind["id"];
      }>,
    ) {
      const { settings, kindId } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      recursiveAssign(selectedModelInfo.preprocessSettings, settings);
    },
    updateInputShape(
      state,
      action: PayloadAction<{ inputShape: Partial<Shape>; kindId: Kind["id"] }>,
    ) {
      const { kindId, inputShape } = action.payload;
      const selectedModelInfo = getSelectedModelInfo(
        state.kindClassifiers,
        kindId,
      );
      selectedModelInfo.preprocessSettings.inputShape = {
        ...selectedModelInfo.preprocessSettings.inputShape,
        ...inputShape,
      };
    },
    updateChannelsGlobally(
      state,
      action: PayloadAction<{ globalChannels: number }>,
    ) {
      Object.keys(state.kindClassifiers).forEach((kind) => {
        state.kindClassifiers[kind].modelInfoDict[
          "base-model"
        ].preprocessSettings.inputShape.channels =
          action.payload.globalChannels;
      });
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
    updateEvaluationResult(
      state,
      action: PayloadAction<{
        evaluationResult: ClassifierEvaluationResultType;
        kindId: Kind["id"];
      }>,
    ) {
      const { evaluationResult, kindId } = action.payload;
      const selectedModel = state.kindClassifiers[kindId];

      selectedModel.modelInfoDict[
        typeof selectedModel.modelNameOrArch === "string"
          ? selectedModel.modelNameOrArch
          : "base-model"
      ].evalResults.push(evaluationResult);
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
