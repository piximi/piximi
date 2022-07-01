import { Classifier } from "../../types/Classifier";
import { ClassifierModelProps } from "../../types/ModelType";

export const uploadedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps | undefined => {
  return classifier.userUploadedModel;
};
