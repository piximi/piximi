import { Classifier } from "../../types/Classifier";

export const classifierSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Classifier => {
  return classifier;
};
