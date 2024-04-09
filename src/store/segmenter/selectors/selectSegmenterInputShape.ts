import { Shape } from "store/data/types";
import { SegmenterState } from "store/types";

export const selectSegmenterInputShape = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): Shape => {
  return segmenter.inputShape;
};
