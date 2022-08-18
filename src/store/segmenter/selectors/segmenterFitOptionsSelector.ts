import { FitOptions } from "types/FitOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterFitOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): FitOptions => {
  return segmenter.fitOptions;
};
