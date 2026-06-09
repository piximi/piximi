import type { Kind } from "store/dataV2/types";
import { generateKind } from "store/dataV2/utils";

import COCO_CLASSES from "data/model-data/cocossd-classes";

export const constructCocoKinds = () => {
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const kinds: Array<Kind> = [];

  cocoClasses.forEach((cocoClass) => {
    const { kind } = generateKind(cocoClass);
    kinds.push(kind);
  });
  return kinds;
};
