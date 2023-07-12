import { SegmenterStoreType } from "types";
import { availableSegmenterModels } from "types/ModelType";

export const segmenterModelIdxSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}) => {
  return {
    idx: segmenter.selectedModelIdx,
    model: availableSegmenterModels[segmenter.selectedModelIdx],
  };
};
