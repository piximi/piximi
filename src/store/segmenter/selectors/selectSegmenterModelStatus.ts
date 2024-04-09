import { SegmenterState } from "store/types";
import { ModelStatus } from "utils/models/enums";

export const selectSegmenterModelStatus = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): ModelStatus => {
  return segmenter.modelStatus;
};
