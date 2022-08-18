import { SegmentationArchitectureOptions, SegmenterStoreType } from "types";

export const segmenterArchitectureOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmentationArchitectureOptions => {
  return {
    inputShape: segmenter.inputShape,
    selectedModel: segmenter.selectedModel,
  };
};
