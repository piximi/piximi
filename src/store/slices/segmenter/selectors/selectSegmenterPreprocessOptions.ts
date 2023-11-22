import { PreprocessOptions } from "types/PreprocessOptions";
import { Segmenter } from "types/Segmenter";

export const selectSegmenterPreprocessOptions = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): PreprocessOptions => {
  return segmenter.preprocessOptions;
};
