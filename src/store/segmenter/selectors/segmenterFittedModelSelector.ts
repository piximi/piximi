import { GraphModel, LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types";

export const segmenterFittedModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | GraphModel | undefined => {
  return segmenter.fitted;
};
