import { GraphModel, LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types";

export const segmenterCompiledModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | GraphModel | undefined => {
  return segmenter.compiled;
};
