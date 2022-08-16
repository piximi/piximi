import { Classifier, CropOptions } from "types";

export const cropOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};
