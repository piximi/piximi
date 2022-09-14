import { Classifier } from "types";

export const classifierValidationDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}) => {
  return classifier.valDataSet;
};
