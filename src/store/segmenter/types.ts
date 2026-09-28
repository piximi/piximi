import type {
  ModelName,
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";

export type SegmenterModelConfig = {
  model: ModelName;
  modelStatus: SegmentationState;
  channelSelection: Array<string>;
  optionValues: SegmenterOptionValues;
};

export type SegmenterSliceState = {
  loadedModel: SegmentationModelDetails | undefined;
  configMap: Record<ModelName, SegmenterModelConfig>;
};
