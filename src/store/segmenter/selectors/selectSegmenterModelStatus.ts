import { Segmenter } from "types";
import { ModelStatus } from "types/ModelType";

export const selectSegmenterModelStatus = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): ModelStatus => {
  return segmenter.modelStatus;
};
