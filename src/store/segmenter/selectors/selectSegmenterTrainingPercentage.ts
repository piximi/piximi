import { SegmenterStoreType } from "types/SegmenterStoreType";

export const selectSegmenterTrainingPercentage = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): number => {
  return segmenter.trainingPercentage;
};
