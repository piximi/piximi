import { ClassifierState, KindClassifierDict } from "store/types";

export const selectClassifier = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};

export const selectKindClassifiers = ({
  classifier,
}: {
  classifier: ClassifierState;
}): KindClassifierDict => {
  return classifier.kindClassifiers;
};

export const selectShowClearPredictionsWarning = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.showClearPredictionsWarning;
};
