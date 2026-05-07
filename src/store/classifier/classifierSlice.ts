import { createSlice } from "@reduxjs/toolkit";

import type { Shape } from "store/dataV2/types";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";

import type { ClassifierEvaluationResultType } from "utils/dl/types";
import type { RecursivePartial } from "utils/types";
import { recursiveAssign } from "utils/objectUtils";

import { IMAGE_CLASSIFIER_ID, IMAGE_CLASSIFIER_NAME } from "./constants";
import { ModelArch } from "./types";

import type {
  ClassifierState,
  KindClassifier,
  ModelClassMap,
  ModelInfo,
  ModelLifecycleStatus,
  Run,
  RunHistoryEpoch,
  RunStatus,
} from "./types";
import type { PayloadAction } from "@reduxjs/toolkit";

const getDefaultKindClassifier = () => ({
  activeModel: undefined,
  newModelArch: ModelArch.SIMPLE_CNN,
  modelInfoDict: {},
  status: "idle" as ModelLifecycleStatus,
});
const initialState: ClassifierState = {
  kindClassifiers: {
    [IMAGE_CLASSIFIER_ID]: {
      modelTargetId: IMAGE_CLASSIFIER_ID,
      modelTargetName: IMAGE_CLASSIFIER_NAME,
      ...getDefaultKindClassifier(),
    },
  },
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
      state.kindClassifiers = initialState.kindClassifiers;
    },
    addKindClassifiers(
      state,
      action: PayloadAction<Array<{ id: string; targetName: string }>>,
    ) {
      action.payload.forEach(
        (newKC) =>
          (state.kindClassifiers[newKC.id] = {
            modelTargetId: newKC.id,
            modelTargetName: newKC.targetName,
            ...getDefaultKindClassifier(),
          }),
      );
    },
    setKindClassifiers(state, action: PayloadAction<Array<KindClassifier>>) {
      action.payload.forEach(
        (kc) => (state.kindClassifiers[kc.modelTargetId] = kc),
      );
    },
    removeKindClassifiers(state, action: PayloadAction<Array<string>>) {
      action.payload.forEach((kindId) => delete state.kindClassifiers[kindId]);
    },

    addModelInfo(
      state,
      action: PayloadAction<{
        targetId: string;
        modelName: string;
        modelInfo: ModelInfo;
      }>,
    ) {
      const { targetId, modelName, modelInfo } = action.payload;
      if (modelName in state.kindClassifiers[targetId].modelInfoDict) {
        throw new Error(
          `Info for model with name "${modelName}" already exists`,
        );
      }
      state.kindClassifiers[targetId].modelInfoDict[modelName] = modelInfo;
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
        targetId: string;
        modelName: string;
        classMapping: ModelClassMap;
      }>,
    ) {
      const { targetId, modelName, classMapping } = action.payload;
      if (!(modelName in state.kindClassifiers[targetId].modelInfoDict)) {
        throw new Error(
          `Info for model with name "${modelName}" does not exists`,
        );
      }
      state.kindClassifiers[targetId].modelInfoDict[modelName].classMap =
        classMapping;
    },
    updateModelOptimizerSettings(
      state,
      action: PayloadAction<{
        settings: Partial<ModelInfo["optimizerSettings"]>;
        targetId: string;
      }>,
    ) {
      const { settings, targetId } = action.payload;
      const kc = state.kindClassifiers[targetId];

      const activeModel = kc.activeModel;
      if (activeModel)
        Object.assign(
          kc.modelInfoDict[activeModel].optimizerSettings,
          settings,
        );
    },
    updateModelPreprocessSettings(
      state,
      action: PayloadAction<{
        settings: RecursivePartial<ModelInfo["preprocessSettings"]>;
        targetId: string;
      }>,
    ) {
      const { settings, targetId } = action.payload;
      const kc = state.kindClassifiers[targetId];

      const activeModel = kc.activeModel;
      if (activeModel)
        recursiveAssign(
          kc.modelInfoDict[activeModel].preprocessSettings,
          settings,
        );
    },
    updateInputShape(
      state,
      action: PayloadAction<{ inputShape: Partial<Shape>; targetId: string }>,
    ) {
      const { targetId, inputShape } = action.payload;
      const kc = state.kindClassifiers[targetId];

      const activeModel = kc.activeModel;
      if (activeModel)
        Object.assign(
          kc.modelInfoDict[activeModel].preprocessSettings.inputShape,
          inputShape,
        );
    },
    setActiveModel(
      state,
      action: PayloadAction<{
        modelName: string | undefined;
        targetId: string;
      }>,
    ) {
      const { modelName, targetId } = action.payload;
      const classifier = state.kindClassifiers[targetId];
      classifier.activeModel = modelName;
      if (modelName === undefined || !(modelName in classifier.modelInfoDict))
        return;
    },
    setNewModelArch(
      state,
      action: PayloadAction<{ modelArch: ModelArch; targetId: string }>,
    ) {
      const { modelArch, targetId } = action.payload;
      const classifier = state.kindClassifiers[targetId];
      classifier.newModelArch = modelArch;
    },

    appendRun(
      state,
      action: PayloadAction<{ targetId: string; modelName: string; run: Run }>,
    ) {
      const { targetId, modelName, run } = action.payload;
      const kc = state.kindClassifiers[targetId];
      if (!kc) return;
      const info = kc.modelInfoDict[modelName];
      if (!info) return;
      info.runs.push(run);
    },
    appendEpochToActiveRun(
      state,
      action: PayloadAction<{
        targetId: string;
        modelName: string;
        epoch: RunHistoryEpoch;
      }>,
    ) {
      const info =
        state.kindClassifiers[action.payload.targetId]?.modelInfoDict[
          action.payload.modelName
        ];
      const run = info?.runs.at(-1);
      if (!run || run.status !== "in-progress") return;
      run.history.push(action.payload.epoch);
    },
    finalizeActiveRun(
      state,
      action: PayloadAction<{
        targetId: string;
        modelName: string;
        finishedAt: string;
        status: RunStatus;
        evalResults?: ClassifierEvaluationResultType;
        weightsRef?: string;
      }>,
    ) {
      const kc = state.kindClassifiers[action.payload.targetId];
      const info = kc?.modelInfoDict[action.payload.modelName];
      const run = info?.runs.at(-1);
      if (!kc || !run || run.status !== "in-progress") return;
      run.finishedAt = action.payload.finishedAt;
      run.status = action.payload.status;
      run.evalResults = action.payload.evalResults;
      run.weightsRef = action.payload.weightsRef;
      kc.status = "idle";
    },
    setModelStatus(
      state,
      action: PayloadAction<{
        targetId: string;
        status: ModelLifecycleStatus;
      }>,
    ) {
      const kc = state.kindClassifiers[action.payload.targetId];
      if (kc) kc.status = action.payload.status;
    },
    setConfidenceThreshold(
      state,
      action: PayloadAction<{
        targetId: string;
        modelName: string;
        threshold: number;
      }>,
    ) {
      const info =
        state.kindClassifiers[action.payload.targetId]?.modelInfoDict[
          action.payload.modelName
        ];
      if (info)
        info.confidenceThreshold = Math.min(
          1,
          Math.max(0, action.payload.threshold),
        );
    },
    recordEvalForRun(
      state,
      action: PayloadAction<{
        targetId: string;
        modelName: string;
        runId: string;
        evalResult: ClassifierEvaluationResultType;
      }>,
    ) {
      const info =
        state.kindClassifiers[action.payload.targetId]?.modelInfoDict[
          action.payload.modelName
        ];
      const run = info?.runs.find((r) => r.id === action.payload.runId);
      if (run) run.evalResults = action.payload.evalResult;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(dataSliceV2.actions.addKind, (state, action) => {
        state.kindClassifiers[action.payload.kind.id] = {
          modelTargetId: action.payload.kind.id,
          modelTargetName: action.payload.kind.name,
          ...getDefaultKindClassifier(),
        };
      })
      .addCase(dataSliceV2.actions.batchAddKind, (state, action) => {
        action.payload.forEach(({ kind }) => {
          state.kindClassifiers[kind.id] = {
            modelTargetId: kind.id,
            modelTargetName: kind.name,
            ...getDefaultKindClassifier(),
          };
        });
      })
      .addCase(dataSliceV2.actions.deleteKind, (state, action) => {
        delete state.kindClassifiers[action.payload];
      })
      .addCase(dataSliceV2.actions.addCategory, (state, action) => {
        const category = action.payload;
        // For every model whose latest run's categorySetHash != current Kind's hash, set status = "stale".
        // Hash is async — but we only have access to the *categoryId* delta here, not the new full set.
        // Easier: just walk all models for the affected kindId and mark stale unconditionally.
        // The full hash check happens at fit time when categoryDelta is computed against the parent run.
        const kindId =
          category.type === "image" ? IMAGE_CLASSIFIER_ID : category.kindId;
        const kc = state.kindClassifiers[kindId];
        if (!kc) return;
        Object.values(kc.modelInfoDict).forEach((info) => {
          if (info.runs.length > 0) info.valid = false;
        });
      })
      .addCase(dataSliceV2.actions.batchAddCategory, (state, action) => {
        action.payload.forEach((category) => {
          const kindId =
            category.type === "image" ? IMAGE_CLASSIFIER_ID : category.kindId;
          const kc = state.kindClassifiers[kindId];
          if (!kc) return;
          Object.values(kc.modelInfoDict).forEach((info) => {
            if (info.runs.length > 0) info.valid = false;
          });
        });
      })
      .addCase(dataSliceV2.actions.deleteCategory, (state, action) => {
        const category = action.payload;
        // For every model whose latest run's categorySetHash != current Kind's hash, set status = "stale".
        // Hash is async — but we only have access to the *categoryId* delta here, not the new full set.
        // Easier: just walk all models for the affected kindId and mark stale unconditionally.
        // The full hash check happens at fit time when categoryDelta is computed against the parent run.
        const kindId =
          category.details.type === "image"
            ? IMAGE_CLASSIFIER_ID
            : category.details.kindId;
        const kc = state.kindClassifiers[kindId];
        if (!kc) return;
        Object.values(kc.modelInfoDict).forEach((info) => {
          if (info.runs.length > 0) info.valid = false;
        });
      })
      .addCase(dataSliceV2.actions.batchDeleteCategory, (state, action) => {
        action.payload.forEach((category) => {
          const kindId =
            category.details.type === "image"
              ? IMAGE_CLASSIFIER_ID
              : category.details.kindId;
          const kc = state.kindClassifiers[kindId];
          if (!kc) return;
          Object.values(kc.modelInfoDict).forEach((info) => {
            if (info.runs.length > 0) info.valid = false;
          });
        });
      })
      .addCase(dataSliceV2.actions.updateKindName, (state, action) => {
        const { kindId, name } = action.payload;
        const kc = state.kindClassifiers[kindId];
        if (!kc) return;
        kc.modelTargetName = name;
      });
  },
});
