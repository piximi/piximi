import { Classifier } from "types";

// TODO: image_data - not used
export const classifierTrainDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}) => {
  return classifier.trainDataSet;
};
