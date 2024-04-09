import COCO_CLASSES from "data/model-data/cocossd-classes";
import { OldCategory, Kind } from "store/data/types";
import { CATEGORY_COLORS } from "utils/common/constants";
import { generateUUID } from "utils/common/helpers";

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
    const unknownCategoryId = generateUUID({ definesUnknown: true });

    kinds.push({
      id: cocoClass,
      categories: [unknownCategoryId],
      containing: [],
      unknownCategoryId,
    });
  });
  return kinds;
};
