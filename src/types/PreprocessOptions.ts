import { RescaleOptions } from "./RescaleOptions";
import { CropOptions } from "./CropOptions";

export type PreprocessOptions = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions; // normalization
  cropOptions: CropOptions;
};
