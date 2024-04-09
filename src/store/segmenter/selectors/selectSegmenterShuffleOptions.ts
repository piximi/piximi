import { SegmenterState } from "store/types";

export const selectSegmenterShuffleOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): boolean => {
  return segmenter.preprocessOptions.shuffle;
};
