import { generateKind } from "core/entities";

import COCO_CLASSES from "data/model-data/cocossd-classes";

import type { Kind } from "core/entities";

export const constructCocoKinds = () => {
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const kinds: Array<Kind> = [];

  cocoClasses.forEach((cocoClass) => {
    const { kind } = generateKind(cocoClass);
    kinds.push(kind);
  });
  return kinds;
};
