import { Segmenter } from "types";

export const selectSegmenterShuffleOptions = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): boolean => {
  return segmenter.preprocessOptions.shuffle;
};
