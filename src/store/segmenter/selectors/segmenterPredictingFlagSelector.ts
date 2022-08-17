import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterPredictingFlagSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): boolean => {
  return segmenter.predicting;
};
