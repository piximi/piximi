import { Kind } from "store/data/types";
import { KindClassifier, KindClassifierDict, ModelInfo } from "store/types";
export function getSelectedModelInfo(
  kindClassifierDictOrItem: KindClassifier,
): ModelInfo;
export function getSelectedModelInfo(
  kindClassifierDictOrItem: KindClassifierDict,
  kindId: Kind["id"],
): ModelInfo;
export function getSelectedModelInfo(
  kindClassifiersDictOrItem: KindClassifierDict | KindClassifier,
  kindId?: Kind["id"],
): ModelInfo {
  let classifier: KindClassifier;
  if (!("modelNameOrArch" in kindClassifiersDictOrItem))
    classifier = (kindClassifiersDictOrItem as KindClassifierDict)[kindId!];
  else {
    classifier = kindClassifiersDictOrItem as KindClassifier;
  }
  const selectedModelName = kindClassifiersDictOrItem.modelNameOrArch;
  console.log(selectedModelName);
  if (typeof selectedModelName === "string")
    return classifier.modelInfoDict[selectedModelName];
  return classifier.modelInfoDict["base-model"];
}
