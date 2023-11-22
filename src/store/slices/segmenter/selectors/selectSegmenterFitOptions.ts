import { FitOptions } from "types/FitOptions";
import { Segmenter } from "types/Segmenter";

export const selectSegmenterFitOptions = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): FitOptions => {
  return segmenter.fitOptions;
};
