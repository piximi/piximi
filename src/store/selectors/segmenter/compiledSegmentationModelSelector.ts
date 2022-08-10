import { LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const compiledSegmentationModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | undefined => {
  return segmenter.compiled;
};
