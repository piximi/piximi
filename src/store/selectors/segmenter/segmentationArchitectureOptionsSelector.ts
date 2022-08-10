import { SegmentationArchitectureOptions } from "types/ArchitectureOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";

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
