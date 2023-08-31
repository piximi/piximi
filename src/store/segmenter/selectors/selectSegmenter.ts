import { SegmenterStoreType } from "types/SegmenterStoreType";

export const selectSegmenter = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterStoreType => {
  return segmenter;
};
