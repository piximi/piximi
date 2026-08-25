import type { SliderOptions } from "utils/types";

export const DEFAULT_PEN_TOOL_OPTIONS: SliderOptions = {
  min: 1,
  max: 25,
  step: 1,
  initial: 10,
};

export const DEFAULT_QUICK_TOOL_OPTIONS: SliderOptions = {
  min: 2,
  max: 100,
  step: 1,
  initial: 40,
};

export const DEFAULT_THRESHOLD_TOOL_OPTIONS: SliderOptions = {
  min: 1,
  max: 255,
  step: 1,
  initial: 150,
};
