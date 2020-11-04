import { Classifier } from "../../types/Classifier";
import { LayersModel } from "@tensorflow/tfjs";

export const openedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.opened!;
};
