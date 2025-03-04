import { KindClassifierDict } from "store/types";

export const getSelectedModelInfo = (
  kindClassifiers: KindClassifierDict,
  kindId: string,
) => {
  const classifier = kindClassifiers[kindId];
  const selectedModelIdx = classifier.selectedModelIdx;
  return classifier.modelInfoDict[selectedModelIdx];
};
