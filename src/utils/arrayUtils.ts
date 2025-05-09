// Given a length, return an array of numbers from 0 to length - 1

import { FilterType } from "./types";

// An iterable with length property set the the passed value is used to create an array
export const arrayRange = (length: number): number[] => {
  return Array.from({ length }, (_, i) => i);
};

export const mutatingFilter = <T>(
  array: Array<T>,
  condition: (arg: T) => boolean,
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
  filters: FilterType<T>,
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

export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};
