import { Classifier } from "types";

export const classifierSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Classifier => {
  return classifier;
};
