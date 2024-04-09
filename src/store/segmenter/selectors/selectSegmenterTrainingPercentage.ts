import { SegmenterState } from "store/types";

export const selectSegmenterTrainingPercentage = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): number => {
  return segmenter.trainingPercentage;
};
