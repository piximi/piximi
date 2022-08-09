import { SegmenterModelProps } from "types/ModelType";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const userUploadedSegmentationModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): SegmenterModelProps | undefined => {
  return segmenter.userUploadedModel;
};
