import { SegmenterStoreType } from "types/SegmenterStoreType";
import { Shape } from "types/Shape";

export const segmenterInputShapeSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): Shape => {
  return segmenter.inputShape;
};
