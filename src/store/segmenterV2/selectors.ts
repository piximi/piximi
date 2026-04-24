import { availableSegmenterModels } from "utils/modelsV2/availableSegmentationModels";

import { SegmenterState } from "store/types";
import { FitOptions } from "utils/models/types";
import { Segmenter } from "utils/modelsV2/segmentation";

export const selectSegmenter = ({
  segmenterV2: segmenter,
}: {
  segmenterV2: SegmenterState;
}): SegmenterState => {
  return segmenter;
};

export const selectSegmenterInferenceOptions = ({
  segmenterV2: segmenter,
}: {
  segmenterV2: SegmenterState;
}): FitOptions => {
  return segmenter.inferenceOptions;
};

export const selectSegmenterModel = ({
  segmenterV2: segmenter,
}: {
  segmenterV2: SegmenterState;
}): Segmenter | undefined => {
  return segmenter.selectedModelIdx === undefined
    ? segmenter.selectedModelIdx
    : availableSegmenterModels[segmenter.selectedModelIdx];
};
