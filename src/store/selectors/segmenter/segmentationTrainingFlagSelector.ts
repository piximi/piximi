import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationTrainingFlagSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): boolean => {
  return segmenter.fitting;
};
