import { SegmenterStoreType } from "types";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export const segmenterModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): Segmenter => {
  return segmenter.selectedModel;
};
