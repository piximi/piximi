import { SegmenterState } from "store/types";
import { FitOptions } from "utils/models/types";

export const selectSegmenterFitOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): FitOptions => {
  return segmenter.fitOptions;
};
