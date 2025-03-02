import { Kind } from "store/data/types";
import { SequentialClassifier } from "./classification/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./classification/MobileNet/MobileNet";
import { SimpleCNN } from "./classification/SimpleCNN/SimpleCNN";
import { DEFAULT_KIND } from "store/data/constants";

export const availableClassifierModels = [SimpleCNN, MobileNet];

export const kindClassifierModelDict: Record<
  Kind["id"],
  Array<SequentialClassifier>
> = {
  [DEFAULT_KIND]: availableClassifierModels.map((model) => new model()),
};
// prevent deleting DEFAULT_KIND
Object.defineProperty(kindClassifierModelDict, DEFAULT_KIND, {
  configurable: false,
});

export const addClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const id of kindIds) {
    if (id in kindClassifierModelDict) {
      throw new Error(
        `Trying to add classifier models for an already existing kind id: ${id}`,
      );
    }

    kindClassifierModelDict[id] = availableClassifierModels.map(
      (model) => new model(),
    );
  }
};

export const deleteClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const id of kindIds) {
    if (!(id in kindClassifierModelDict)) {
      throw new Error(
        `Trying to delete classifier models for an non-existant kind id: ${id}`,
      );
    }

    for (const model of kindClassifierModelDict[id]) {
      model.dispose();
    }
    try {
      delete kindClassifierModelDict[id];
    } catch {
      // do nothing; we expect this when "delete" called on DEFAULT_KIND
    }
  }
};
