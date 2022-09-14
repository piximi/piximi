import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterValDataSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}) => {
  return segmenter.valDataSet;
};
