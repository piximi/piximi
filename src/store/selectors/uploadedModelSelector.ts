import { Classifier } from "../../types/Classifier";
import { ClassifierModelProps } from "../../types/ClassifierModelType";

export const uploadedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps | undefined => {
  return classifier.userUploadedModel;
};
