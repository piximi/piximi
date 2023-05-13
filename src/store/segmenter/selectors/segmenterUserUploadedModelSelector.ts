import { SegmenterStoreType } from "types/SegmenterStoreType";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export const segmenterUserUploadedModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): Segmenter | undefined => {
  return segmenter.userUploadedModel;
};
