import { ClassifierState, KindClassifierDict } from "store/types";

export const selectClassifier = ({
  classifierV2: classifier,
}: {
  classifierV2: ClassifierState;
}): ClassifierState => {
  return classifier;
};

export const selectKindClassifiers = ({
  classifierV2: classifier,
}: {
  classifierV2: ClassifierState;
}): KindClassifierDict => {
  return classifier.kindClassifiers;
};

export const selectShowClearPredictionsWarning = ({
  classifierV2: classifier,
}: {
  classifierV2: ClassifierState;
}): boolean => {
  return classifier.showClearPredictionsWarning;
};
