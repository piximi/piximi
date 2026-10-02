import { createSlice } from "@reduxjs/toolkit";

import {
  getDefaultChannelIds,
  reconcileChannelSelection,
} from "core/dl/segmentation/channelUtils";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { MODELS } from "core/dl/segmentation/types";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { projectReset } from "store/actions";

import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  ModelName,
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionType,
} from "core/dl/segmentation/types";

import type { SegmenterModelConfig, SegmenterSliceState } from "./types";

export const getBlankModelConfig = (model: ModelName): SegmenterModelConfig => {
  return {
    model,
    modelStatus: "idle",
    channelSelection: [],
    kindName: undefined,
    optionValues: {},
  };
};

/*
 * A fresh config for each named model. Derived from the names rather than
 * written out key-by-key so a model added to `MODELS` cannot be forgotten here,
 * and so the project loader can build the same map before overlaying whatever
 * a saved project carried.
 */
export const createBlankModelConfigMap = (
  modelNames: readonly ModelName[],
): Record<ModelName, SegmenterModelConfig> =>
  Object.fromEntries(
    modelNames.map((name) => [name, getBlankModelConfig(name)]),
  ) as Record<ModelName, SegmenterModelConfig>;

export const getInitialState = (): SegmenterSliceState => ({
  loadedModel: undefined,
  configMap: createBlankModelConfigMap(MODELS),
});
export const segmenterSlice = createSlice({
  name: "segmenter",
  initialState: getInitialState(),
  reducers: {
    resetSegmenterState() {
      return getInitialState();
    },
    setSegmenter(
      state,
      action: PayloadAction<{ segmenter: SegmenterSliceState }>,
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.segmenter;
      return action.payload.segmenter;
    },
    modelLoaded(
      state,
      action: PayloadAction<{
        model: SegmentationModelDetails;
        availableChannelIds: Array<string>;
      }>,
    ) {
      const { model, availableChannelIds } = action.payload;
      state.loadedModel = model;

      if (
        !state.configMap[model.name].kindName &&
        model.outputPolicy.mode === OUTPUT_MODE.SINGLE
      )
        state.configMap[model.name].kindName =
          model.outputPolicy.defaultKindName;

      // Reconcile rather than reseed: a selection restored from a saved project
      // is only visible once its model is loaded, so overwriting here would
      // destroy it at the exact moment it became usable.
      state.configMap[model.name].channelSelection = reconcileChannelSelection(
        model.channelPolicy,
        state.configMap[model.name].channelSelection,
        availableChannelIds,
      );
    },
    kindNameSet(state, action: PayloadAction<string>) {
      const model = state.loadedModel;
      if (!model) return;

      state.configMap[model.name].kindName = action.payload;
    },
    optionValueSet(
      state,
      action: PayloadAction<{ key: string; value: SegmenterOptionType }>,
    ) {
      const option = action.payload;
      const model = state.loadedModel;
      if (!model) return;

      Object.assign(state.configMap[model.name].optionValues, {
        [option.key]: option.value,
      });
    },
    channelSlotSet(
      state,
      action: PayloadAction<{ index: number; id: string }>,
    ) {
      const channel = action.payload;
      const model = state.loadedModel;
      if (!model) return;
      const selectedChannels = state.configMap[model.name].channelSelection;
      if (channel.index >= selectedChannels.length) return;
      selectedChannels[channel.index] = channel.id;
    },
    channelSlotRemoved(state, action: PayloadAction<number>) {
      const index = action.payload;
      const model = state.loadedModel;
      if (!model || model.channelPolicy.mode !== CHANNEL_MODE.PASSTHROUGH)
        return;
      const selectedChannels = state.configMap[model.name].channelSelection;
      if (
        selectedChannels.length == 1 ||
        index < 0 ||
        index >= selectedChannels.length
      )
        return;
      selectedChannels.splice(index, 1);
    },
    channelSlotAdded(state) {
      const model = state.loadedModel;
      if (!model || model.channelPolicy.mode !== CHANNEL_MODE.PASSTHROUGH)
        return;
      const selectedChannels = state.configMap[model.name].channelSelection;
      const lastChannel = selectedChannels.at(-1);
      if (
        lastChannel === undefined ||
        selectedChannels.length >= model.channelPolicy.maxChannels
      )
        return;
      selectedChannels.push(lastChannel);
    },
    modelStatusSet(state, action: PayloadAction<SegmentationState>) {
      const status = action.payload;
      const model = state.loadedModel;
      if (!model) return;
      state.configMap[model.name].modelStatus = status;
    },
    configReset(
      state,
      action: PayloadAction<{
        availableChannelIds: string[];
      }>,
    ) {
      const { availableChannelIds } = action.payload;
      const model = state.loadedModel;
      if (!model) return;
      state.configMap[model.name] = getBlankModelConfig(model.name);
      state.configMap[model.name].channelSelection = getDefaultChannelIds(
        model.channelPolicy,
        availableChannelIds,
      );
    },
  },
  extraReducers(builder) {
    builder.addCase(projectReset, () => getInitialState());
  },
});
