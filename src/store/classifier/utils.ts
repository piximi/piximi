import type { Kind } from "store/data/types";

import { BASE_MODEL_NAME } from "./constants";

import type { KindClassifierDict, ModelInfo } from "./types";

export function getSelectedModelInfo(
  kindClassifiersDict: KindClassifierDict,
  kindId?: Kind["id"],
): ModelInfo {
  const classifier = kindClassifiersDict[kindId!];

  const activeModel = classifier.activeModel;
  if (activeModel) return classifier.modelInfoDict[activeModel];
  return classifier.modelInfoDict[BASE_MODEL_NAME];
}
