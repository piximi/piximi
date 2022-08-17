import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterTrainingFlagSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): boolean => {
  return segmenter.fitting;
};
