import { Segmenter } from "types/Segmenter";
import { Shape } from "types/Shape";

export const selectSegmenterInputShape = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): Shape => {
  return segmenter.inputShape;
};
