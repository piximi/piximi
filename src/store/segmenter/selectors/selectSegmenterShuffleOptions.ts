import { SegmenterStoreType } from "types";

export const selectSegmenterShuffleOptions = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): boolean => {
  return segmenter.preprocessOptions.shuffle;
};
