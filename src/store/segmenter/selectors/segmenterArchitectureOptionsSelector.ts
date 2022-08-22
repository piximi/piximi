import { SegmenterArchitectureOptions, SegmenterStoreType } from "types";

export const segmenterArchitectureOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterArchitectureOptions => {
  return {
    inputShape: segmenter.inputShape,
    selectedModel: segmenter.selectedModel,
  };
};
