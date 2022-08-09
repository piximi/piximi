import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterStoreType => {
  return segmenter;
};
