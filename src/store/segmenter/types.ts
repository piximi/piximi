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
  /* Undefined iff the model's OutputPolicy is `classes` — its kinds come from
   * the detections, so there is nothing for the user to name. */
  kindName: string | undefined;
  optionValues: SegmenterOptionValues;
};

export type SegmenterSliceState = {
  loadedModel: SegmentationModelDetails | undefined;
  configMap: Record<ModelName, SegmenterModelConfig>;
};
