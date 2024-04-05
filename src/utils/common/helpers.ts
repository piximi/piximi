import { FilterType, Shape, ShapeArray } from "types";
import { NewCategory, UNKNOWN_CATEGORY_NAME } from "types/Category";
import { v4 as uuidv4 } from "uuid";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "./colorPalette";

export const mutatingFilter = <T>(
  array: Array<T>,
  condition: (arg: T) => boolean
): void => {
  for (let l = array.length - 1; l >= 0; l -= 1) {
    if (!condition(array[l])) array.splice(l, 1);
  }
};

export const toUnique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const isFiltered = <T extends object>(
  object: T,
  filters: FilterType<T>
): boolean => {
  return Object.keys(object).some((key) => {
    const itemValue = object[key as keyof T];
    const filterValues = filters[key as keyof T];

    if (Array.isArray(filterValues)) {
      return (filterValues as Array<typeof itemValue>).includes(itemValue);
    }

    // If the key is not present in the record, include the item
    return false;
  });
};

export const filterObjects = <T extends object>(
  objectArr: T[],
  filters: FilterType<T>
): T[] => {
  return objectArr.filter((item) => {
    return Object.keys(item).every((key) => {
      const itemValue = item[key as keyof T];
      const filterValues = filters[key as keyof T];

      if (Array.isArray(filterValues)) {
        return !(filterValues as Array<typeof itemValue>).includes(itemValue);
      }

      // If the key is not present in the record, include the item
      return true;
    });
  });
};

export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};

export const getSubset = <T, K extends keyof T>(object: T, keys: K[]) => {
  const subset: Record<string, (typeof object)[K]> = {};

  keys.forEach((key) => {
    subset[key as string] = object[key];
  });
  return subset;
};

export const generateUUID = (options?: { definesUnknown: boolean }) => {
  let id = uuidv4();
  let unknownFlag: string;
  if (options?.definesUnknown) {
    unknownFlag = "0";
  } else {
    unknownFlag = "1";
  }
  return unknownFlag + id.slice(1);
};

export const isUnknownCategory = (categoryId: string) => {
  return categoryId[0] === "0";
};

export const generateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: NewCategory = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: kind,
    visible: true,
  };
  return unknownCategory;
};

export const convertShapeToArray = (shape: Shape): ShapeArray => {
  return Object.values(shape) as ShapeArray;
};

export const convertArrayToShape = (array: ShapeArray): Shape => {
  return {
    planes: array[0],
    height: array[1],
    width: array[2],
    channels: array[3],
  };
};
