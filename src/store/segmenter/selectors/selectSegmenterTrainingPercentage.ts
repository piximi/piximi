import { Segmenter } from "types/Segmenter";

export const selectSegmenterTrainingPercentage = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): number => {
  return segmenter.trainingPercentage;
};
