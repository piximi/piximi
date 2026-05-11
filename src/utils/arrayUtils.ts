// Given a length, return an array of numbers from 0 to length - 1

import { difference } from "lodash";

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

export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};

export const getDifferences = <T>(original: T[], next: T[]) => {
  return {
    added: difference(next, original),
    removed: difference(original, next),
  };
};

export const findAdjacentItem = <T>(
  items: T[],
  item: T,
  matcher?: (item: T) => boolean,
) => {
  matcher ??= (itm: T) => itm === item;
  const idx = items.findIndex(matcher);
  if (idx === -1) throw new Error("Invalid Kind");
  if (idx === 0) {
    if (items.length === 1) return "null";
    return items[1];
  }
  return items[idx - 1];
};
