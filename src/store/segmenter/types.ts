import { FitOptions } from "utils/dl/types";

export type SegmenterState = {
  // pre-fit state
  selectedModelIdx?: number;
  inferenceOptions: FitOptions;
};
