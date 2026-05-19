import { FitOptions } from "utils/dl/classification/types";

export type SegmenterState = {
  // pre-fit state
  selectedModelIdx?: number;
  inferenceOptions: FitOptions;
};
