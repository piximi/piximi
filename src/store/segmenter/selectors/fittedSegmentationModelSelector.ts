import { LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types";

export const fittedSegmentationModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | undefined => {
  return segmenter.fitted;
};
