import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { availableSegmenterModels as availableSegmenterModelsV2 } from "utils/modelsV2/availableSegmentationModels";

import { SegmenterState } from "store/types";
import { FitOptions } from "utils/models/types";
import { Segmenter } from "utils/models/segmentation";
import { Segmenter as SegmenterV2 } from "utils/modelsV2/segmentation";

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

export const selectSegmenterModelV2 = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): SegmenterV2 | undefined => {
  return segmenter.selectedModelIdx === undefined
    ? segmenter.selectedModelIdx
    : availableSegmenterModelsV2[segmenter.selectedModelIdx];
};
