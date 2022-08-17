import { Classifier, CropOptions } from "types";

export const classifierCropOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};
