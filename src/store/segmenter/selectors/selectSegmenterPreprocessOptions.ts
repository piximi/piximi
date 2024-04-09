import { SegmenterState } from "store/types";
import { PreprocessOptions } from "utils/models/types";

export const selectSegmenterPreprocessOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): PreprocessOptions => {
  return segmenter.preprocessOptions;
};
