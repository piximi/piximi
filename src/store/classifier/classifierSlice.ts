import { createSlice } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash";

import type {
  ClassifierState,
  KindClassifier,
  ModelClassMap,
  ModelInfo,
} from "./types";
import type { Shape } from "store/dataV2/types";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";

import { getDefaultModelInfo } from "utils/dl/classification/utils";
import type { ClassifierEvaluationResultType } from "utils/dl/types";
import type { RecursivePartial } from "utils/types";
import { recursiveAssign } from "utils/objectUtils";

import { getSelectedModelInfo } from "./utils";

import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: ClassifierState = {
  kindClassifiers: {
    [IMAGE_CLASSIFIER_ID]: {
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
        [IMAGE_CLASSIFIER_ID]: {
          modelNameOrArch: 0,
          modelInfoDict: {
            "base-model": getDefaultModelInfo(),
          },
        },
      };
    },
    updateKindClassifiers(
      state,
      action: PayloadAction<{
        changes:
          | {
              add: Array<string>;
              presetInfo?: Array<KindClassifier>;
            }
          | { del: Array<string> };
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
                    modelInfoDict: {
                      "base-model": getDefaultModelInfo(),
                    },
                  }),
        );
      } else {
        changes.del.forEach((kindId) => delete state.kindClassifiers[kindId]);
      }
    },
    addModelInfo(
      state,
      action: PayloadAction<{
        kindId: string;
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
        modelName: string;
      }>,
    ) {
      const { modelName } = action.payload;
      Object.keys(state.kindClassifiers).forEach((kindId) => {
        delete state.kindClassifiers[kindId].modelInfoDict[modelName];
      });
    },
    addModelClassMapping(
      state,
      action: PayloadAction<{
        kindId: string;
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
        kindId: string;
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
        kindId: string;
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
      action: PayloadAction<{ inputShape: Partial<Shape>; kindId: string }>,
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
        kindId: string;
      }>,
    ) {
      const { modelName, kindId } = action.payload;
      const classifier = state.kindClassifiers[kindId];
      classifier.modelNameOrArch = modelName;
      if (typeof modelName === "number") return;
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
        kindId: string;
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
  extraReducers(builder) {
    builder
      .addCase(dataSliceV2.actions.addKind, (state, action) => {
        state.kindClassifiers[action.payload.kind.id] = {
          modelNameOrArch: 0,
          modelInfoDict: { "base-model": getDefaultModelInfo() },
        };
      })
      .addCase(dataSliceV2.actions.batchAddKind, (state, action) => {
        action.payload.forEach(({ kind }) => {
          state.kindClassifiers[kind.id] = {
            modelNameOrArch: 0,
            modelInfoDict: { "base-model": getDefaultModelInfo() },
          };
        });
      })
      .addCase(dataSliceV2.actions.deleteKind, (state, action) => {
        delete state.kindClassifiers[action.payload];
      });
  },
});
