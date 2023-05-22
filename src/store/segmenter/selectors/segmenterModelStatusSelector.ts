import { SegmenterStoreType } from "types";
import { ModelStatus } from "types/ModelType";

export const segmenterModelStatusSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): ModelStatus => {
  return segmenter.modelStatus;
};
