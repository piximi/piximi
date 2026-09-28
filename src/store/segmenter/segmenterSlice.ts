import { createSlice } from "@reduxjs/toolkit";

import { getDefaultChannelIds } from "core/dl/segmentation/channelUtils";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";

import { projectReset } from "store/actions";

import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  ModelName,
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionType,
} from "core/dl/segmentation/types";

import type { SegmenterModelConfig, SegmenterSliceState } from "./types";

export const getInitialModelConfig = (
  model: ModelName,
): SegmenterModelConfig => {
  if (model === "Cellpose-SAM")
    return {
      model: model,
      modelStatus: "idle",
      channelSelection: [],
      optionValues: {
        diameter: "auto",
        cellPropThreshold: 0,
        resample: "false",
        niter: 200,
        maxSizeFraction: 0.4,
      },
    };
  return {
    model: model,
    modelStatus: "idle",
    channelSelection: [],
    optionValues: {},
  };
};

export const getInitialState = (): SegmenterSliceState => ({
  loadedModel: undefined,
  configMap: {
    "Cellpose-SAM": getInitialModelConfig("Cellpose-SAM"),
    StardistVHE: getInitialModelConfig("StardistVHE"),
    StardistFluo: getInitialModelConfig("StardistFluo"),
    GlandSegmentation: getInitialModelConfig("GlandSegmentation"),
    "COCO-SSD": getInitialModelConfig("COCO-SSD"),
  },
});
export const segmenterSlice = createSlice({
  name: "segmenter",
  initialState: getInitialState(),
  reducers: {
    resetSegmenterState() {
      return getInitialState();
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
      state.configMap[model.name].channelSelection = getDefaultChannelIds(
        model.channelPolicy,
        availableChannelIds,
      );
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
      state.configMap[model.name] = getInitialModelConfig(model.name);
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
