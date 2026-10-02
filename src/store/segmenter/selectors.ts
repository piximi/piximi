import { createSelector } from "@reduxjs/toolkit";

import { selectExtendedImages } from "store/data/selectors";
import { segmenterError } from "store/segmenter/segmenterReadiness";

import type {
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";

import type { SegmenterModelConfig, SegmenterSliceState } from "./types";

export const selectLoadedSegmenter = ({
  segmenter,
}: {
  segmenter: SegmenterSliceState;
}): SegmentationModelDetails | undefined => {
  return segmenter.loadedModel;
};
export const selectSegmenterConfig = ({
  segmenter,
}: {
  segmenter: SegmenterSliceState;
}): SegmenterModelConfig | undefined => {
  const loadedModel = segmenter.loadedModel;
  if (!loadedModel) return undefined;
  return segmenter.configMap[loadedModel.name];
};

export const selectSegmenterStatus = createSelector(
  selectSegmenterConfig,
  (config): SegmentationState => {
    if (!config) return "idle";
    return config.modelStatus;
  },
);

export const selectSegmenterKindName = createSelector(
  selectSegmenterConfig,
  (config): string | undefined => {
    if (!config) return undefined;
    return config.kindName;
  },
);

export const selectSegmenterChannels = createSelector(
  selectSegmenterConfig,
  (config): string[] => {
    if (!config) return [];
    return config.channelSelection;
  },
);

export const selectSegmenterOptions = createSelector(
  selectSegmenterConfig,
  (config): SegmenterOptionValues => {
    if (!config) return {};
    return config.optionValues;
  },
);

export const selectSegmentorError = createSelector(
  selectLoadedSegmenter,
  selectSegmenterChannels,
  selectExtendedImages,
  (loadedModel, channelSelection, projectImages) =>
    segmenterError({
      policy: loadedModel?.channelPolicy,
      channelIds: channelSelection,
      imageCount: projectImages.length,
    }),
);
