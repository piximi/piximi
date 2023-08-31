import { Classifier, CropOptions } from "types";

export const selectClassifierCropOptions = ({
  classifier,
}: {
  classifier: Classifier;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};
