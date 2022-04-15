import { Classifier } from "../../types/Classifier";
import { CropOptions } from "../../types/CropOptions";

export const cropOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};
