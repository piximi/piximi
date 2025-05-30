import COCO_CLASSES from "data/model-data/cocossd-classes";
import { OldCategory, Kind } from "store/data/types";
import { generateKind, generateUUID } from "store/data/utils";
import { CATEGORY_COLORS } from "store/data/constants";

export const constructCocoCategories = () => {
  const categories: Array<OldCategory> = [];
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const availableColors = Object.values(CATEGORY_COLORS);

  for (let i = 0; i < cocoClasses.length; i++) {
    categories.push({
      name: cocoClasses[i],
      visible: true,
      id: generateUUID(),
      color: availableColors[i % availableColors.length],
    });
  }

  return categories;
};

export const constructCocoKinds = () => {
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const kinds: Array<Kind> = [];

  cocoClasses.forEach((cocoClass) => {
    const { kind } = generateKind(cocoClass, true);
    kinds.push(kind);
  });
  return kinds;
};
