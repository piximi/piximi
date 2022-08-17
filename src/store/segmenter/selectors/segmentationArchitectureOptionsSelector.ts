import { SegmentationArchitectureOptions, SegmenterStoreType } from "types";

export const segmentationArchitectureOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmentationArchitectureOptions => {
  return {
    inputShape: segmenter.inputShape,
    selectedModel: segmenter.selectedModel,
  };
};
