import { createSlice } from "@reduxjs/toolkit";

import { UNKNOWN_KIND, UNKNOWN_KIND_ID } from "core/entities";
import { ARCHITECTURE_IDS, ModelArch } from "core/dl/classification/types";

import { dataSlice } from "store/data";
import { projectReset } from "store/actions";

import { IMAGE_CLASSIFIER_ID, IMAGE_CLASSIFIER_NAME } from "./constants";

import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  Classifier,
  ModelLifecycleStatus,
  RunHistoryEpoch,
} from "core/dl/classification/types";

import type { ClassifierState, KindClassifier, SoftmaxById } from "./types";

const getDefaultKindClassifier = () => ({
  activeModel: undefined,
  newModelArch: ARCHITECTURE_IDS[ModelArch.SIMPLE_CNN],
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
    [UNKNOWN_KIND_ID]: {
      modelTargetId: UNKNOWN_KIND_ID,
      modelTargetName: UNKNOWN_KIND.name,
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

    /*
     * The records a backend announces, every classifier of the project:
     * each target's dictionary is rebuilt from them, so one that went away
     * disappears, and a session's active choice is dropped with it.
     */
    setClassifiers(state, action: PayloadAction<Classifier[]>) {
      const byTarget = new Map<string, Classifier[]>();
      for (const classifier of action.payload) {
        const group = byTarget.get(classifier.targetId) ?? [];
        group.push(classifier);
        byTarget.set(classifier.targetId, group);
      }
      for (const kc of Object.values(state.kindClassifiers)) {
        kc.modelInfoDict = Object.fromEntries(
          (byTarget.get(kc.modelTargetId) ?? []).map((c) => [c.id, c]),
        );
        if (kc.activeModel && !(kc.activeModel in kc.modelInfoDict)) {
          kc.activeModel = undefined;
        }
      }
    },
    upsertClassifier(state, action: PayloadAction<Classifier>) {
      const classifier = action.payload;
      const kc = state.kindClassifiers[classifier.targetId];
      if (kc) kc.modelInfoDict[classifier.id] = classifier;
    },
    removeClassifier(state, action: PayloadAction<string>) {
      for (const kc of Object.values(state.kindClassifiers)) {
        delete kc.modelInfoDict[action.payload];
        if (kc.activeModel === action.payload) kc.activeModel = undefined;
      }
    },
    /* One epoch of a run, as a backend announces it. */
    appendEpoch(
      state,
      action: PayloadAction<{
        classifierId: string;
        runId: string;
        epoch: RunHistoryEpoch;
      }>,
    ) {
      for (const kc of Object.values(state.kindClassifiers)) {
        const run = kc.modelInfoDict[action.payload.classifierId]?.runs.find(
          (r) => r.id === action.payload.runId,
        );
        if (run) run.history.push(action.payload.epoch);
      }
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
      action: PayloadAction<{ modelArch: string; targetId: string }>,
    ) {
      const { modelArch, targetId } = action.payload;
      const classifier = state.kindClassifiers[targetId];
      classifier.newModelArch = modelArch;
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
    setActiveSoftmax(
      state,
      action: PayloadAction<{
        targetId: string;
        softmax: SoftmaxById | undefined;
      }>,
    ) {
      const kc = state.kindClassifiers[action.payload.targetId];
      if (kc) kc.activeSoftmaxById = action.payload.softmax;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(projectReset, () => ({ ...initialState }))
      .addCase(dataSlice.actions.addKind, (state, action) => {
        state.kindClassifiers[action.payload.kind.id] = {
          modelTargetId: action.payload.kind.id,
          modelTargetName: action.payload.kind.name,
          ...getDefaultKindClassifier(),
        };
      })
      .addCase(dataSlice.actions.batchAddKind, (state, action) => {
        action.payload.forEach(({ kind }) => {
          state.kindClassifiers[kind.id] = {
            modelTargetId: kind.id,
            modelTargetName: kind.name,
            ...getDefaultKindClassifier(),
          };
        });
      })
      .addCase(dataSlice.actions.deleteKind, (state, action) => {
        delete state.kindClassifiers[action.payload];
      })
      .addCase(dataSlice.actions.addCategory, (state, action) => {
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
      .addCase(dataSlice.actions.batchAddCategory, (state, action) => {
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
      .addCase(dataSlice.actions.deleteCategory, (state, action) => {
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
      .addCase(dataSlice.actions.batchDeleteCategory, (state, action) => {
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
      .addCase(dataSlice.actions.updateKindName, (state, action) => {
        const { kindId, name } = action.payload;
        const kc = state.kindClassifiers[kindId];
        if (!kc) return;
        kc.modelTargetName = name;
      });
  },
});
