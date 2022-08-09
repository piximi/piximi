import { PreprocessOptions } from "types/PreprocessOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationPreprocessOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): PreprocessOptions => {
  return segmenter.preprocessOptions;
};
