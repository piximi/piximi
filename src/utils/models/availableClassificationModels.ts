import { Kind } from "store/data/types";
import { SequentialClassifier } from "./classification/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./classification/MobileNet/MobileNet";
import { SimpleCNN } from "./classification/SimpleCNN/SimpleCNN";
import { DEFAULT_KIND } from "store/data/constants";

export const availableClassifierModels: Record<
  Kind["id"],
  Array<SequentialClassifier>
> = {
  [DEFAULT_KIND]: [new SimpleCNN(), new MobileNet()],
};
// prevent deleting DEFAULT_KIND
Object.defineProperty(availableClassifierModels, DEFAULT_KIND, {
  configurable: false,
});

export const addClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const kid of kindIds) {
    if (kid in availableClassifierModels) {
      throw new Error(
        `Trying to add classifier models for an already existing kind id: ${kid}`
      );
    }

    availableClassifierModels[kid] = [new SimpleCNN(), new MobileNet()];
  }
};

export const deleteClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const kid of kindIds) {
    if (!(kid in availableClassifierModels)) {
      throw new Error(
        `Trying to delete classifier models for an non-existant kind id: ${kid}`
      );
    }

    for (const model of availableClassifierModels[kid]) {
      model.dispose();
    }
    try {
      delete availableClassifierModels[kid];
    } catch {
      // do nothing; we expect this when "delete" called on DEFAULT_KIND
    }
  }
};
