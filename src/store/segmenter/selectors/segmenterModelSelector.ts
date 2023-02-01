import { SegmenterModelProps, SegmenterStoreType } from "types";

export const segmenterModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterModelProps => {
  return segmenter.selectedModel;
};
