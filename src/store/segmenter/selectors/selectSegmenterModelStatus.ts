import { SegmenterStoreType } from "types";
import { ModelStatus } from "types/ModelType";

export const selectSegmenterModelStatus = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): ModelStatus => {
  return segmenter.modelStatus;
};
