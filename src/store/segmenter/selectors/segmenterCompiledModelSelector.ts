import { LayersModel } from "@tensorflow/tfjs";
import { SegmenterStoreType } from "types";

export const segmenterCompiledModelSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): LayersModel | undefined => {
  return segmenter.compiled;
};
