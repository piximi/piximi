import { CompileOptions } from "types/CompileOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";

export const segmentationCompileOptionsSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}): CompileOptions => {
  return segmenter.compileOptions;
};
