import { Classifier, ClassifierModelProps } from "types";

export const uploadedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps | undefined => {
  return classifier.userUploadedModel;
};
