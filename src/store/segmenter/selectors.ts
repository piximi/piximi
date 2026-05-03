import { availableSegmenterModels } from "utils/modelsV2/availableSegmentationModels";

import { SegmenterState } from "store/types";
import { FitOptions } from "utils/modelsV2/types";
import { Segmenter } from "utils/modelsV2/segmentation";

export const selectSegmenter = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): SegmenterState => {
  return segmenter;
};

export const selectSegmenterInferenceOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): FitOptions => {
  return segmenter.inferenceOptions;
};

export const selectSegmenterModel = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): Segmenter | undefined => {
  return segmenter.selectedModelIdx === undefined
    ? segmenter.selectedModelIdx
    : availableSegmenterModels[segmenter.selectedModelIdx];
};
