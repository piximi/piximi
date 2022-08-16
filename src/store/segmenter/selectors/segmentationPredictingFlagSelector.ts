import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationPredictingFlagSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): boolean => {
  return segmenter.predicting;
};
