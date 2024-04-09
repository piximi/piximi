import { SegmenterState } from "store/types";
import { CompileOptions } from "utils/models/types";

export const selectSegmenterCompileOptions = ({
  segmenter,
}: {
  segmenter: SegmenterState;
}): CompileOptions => {
  return segmenter.compileOptions;
};
