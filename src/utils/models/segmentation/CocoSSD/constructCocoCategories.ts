import COCO_CLASSES from "data/model-data/cocossd-classes";
import { Kind } from "store/data/types";
import { generateKind } from "store/data/utils";

export const constructCocoKinds = () => {
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const kinds: Array<Kind> = [];

  cocoClasses.forEach((cocoClass) => {
    const { kind } = generateKind(cocoClass, true);
    kinds.push(kind);
  });
  return kinds;
};
