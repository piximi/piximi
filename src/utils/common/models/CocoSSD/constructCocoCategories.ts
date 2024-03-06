import { v4 as uuid } from "uuid";
import COCO_CLASSES from "data/model-data/cocossd-classes";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

import { Category } from "types";
import { Kind, NEW_UNKNOWN_CATEGORY_ID } from "types/Category";

export const constructCocoCategories = () => {
  const categories: Array<Category> = [];
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);
  const availableColors = Object.values(CATEGORY_COLORS);

  for (let i = 0; i < cocoClasses.length; i++) {
    categories.push({
      name: cocoClasses[i],
      visible: true,
      id: uuid(),
      color: availableColors[i % availableColors.length],
    });
  }

  return categories;
};

export const constructCocoKinds = () => {
  const cocoClasses = Object.values(COCO_CLASSES).map((cl) => cl.displayName);

  const kinds: Array<Kind> = cocoClasses.map((cocoClass) => ({
    id: cocoClass,
    categories: [NEW_UNKNOWN_CATEGORY_ID],
    containing: [],
  }));
  return kinds;
};
