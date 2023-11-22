import { CompileOptions } from "types/CompileOptions";
import { Segmenter } from "types/Segmenter";

export const selectSegmenterCompileOptions = ({
  segmenter,
}: {
  segmenter: Segmenter;
}): CompileOptions => {
  return segmenter.compileOptions;
};
