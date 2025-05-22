import { availableSegmenterModels } from "utils/models/availableSegmentationModels";

import { SegmenterState } from "store/types";
import { FitOptions } from "utils/models/types";
import { Segmenter } from "utils/models/segmentation";

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
