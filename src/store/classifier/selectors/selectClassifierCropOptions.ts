import { ClassifierState } from "store/types";
import { CropOptions } from "utils/models/types";

export const selectClassifierCropOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};
