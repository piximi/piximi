import { LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const fittedSegmentationModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | undefined => {
  return segmenter.fitted;
};
