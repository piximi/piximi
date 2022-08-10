import { SegmenterStoreType } from "types/SegmenterStoreType";
import { Shape } from "types/Shape";

export const segmentationInputShapeSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): Shape => {
  return segmenter.inputShape;
};
