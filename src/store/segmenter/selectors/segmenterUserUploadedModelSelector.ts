import { SegmenterModelProps } from "types/ModelType";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmenterUserUploadedModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterModelProps | undefined => {
  return segmenter.userUploadedModel;
};
