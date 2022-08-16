import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationTrainingPercentageSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): number => {
  return segmenter.trainingPercentage;
};
