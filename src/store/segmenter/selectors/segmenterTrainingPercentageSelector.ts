import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterTrainingPercentageSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): number => {
  return segmenter.trainingPercentage;
};
