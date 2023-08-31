import { SegmenterStoreType } from "types/SegmenterStoreType";
import { Shape } from "types/Shape";

export const selectSegmenterInputShape = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): Shape => {
  return segmenter.inputShape;
};
