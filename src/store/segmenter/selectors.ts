import { availableSegmenterModels } from "utils/dl/availableSegmentationModels";

import { FitOptions } from "utils/dl/types";
import { Segmenter } from "utils/dl/segmentation";
import { SegmenterState } from "./types";

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
