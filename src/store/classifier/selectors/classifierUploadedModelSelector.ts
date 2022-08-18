import { Classifier, ClassifierModelProps } from "types";

export const classifierUploadedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps | undefined => {
  return classifier.userUploadedModel;
};
