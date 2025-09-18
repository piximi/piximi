import { difference } from "lodash";
import { FilterType } from "./types";
import { addToSimpleRelationship } from "./objectUtils";

/**
 * Creates an array of numbers from 0 to length - 1.
 * @param {number} length - The desired length of the array
 * @returns {number[]} An array containing integers from 0 to length - 1
 */
export const arrayRange = (length: number): number[] => {
  return Array.from({ length }, (_, i) => i);
};

/**
 * Filters an array in place by removing elements that don't meet the condition.
 * @template T
 * @param {Array<T>} array - The array to filter in place
 * @param {function(T): boolean} condition - The condition function to test each element
 * @returns {void}
 */
export const mutatingFilter = <T>(
  array: Array<T>,
  condition: (arg: T) => boolean,
): void => {
  for (let l = array.length - 1; l >= 0; l -= 1) {
    if (!condition(array[l])) array.splice(l, 1);
  }
};

/**
 * Returns a new array with only unique values from the input array.
 * @template T
 * @param {T[]} array - The input array
 * @returns {T[]} A new array containing only unique values
 */
export const toUnique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Checks if an object matches any of the provided filters.
 * @template T
 * @param {T} object - The object to check against filters
 * @param {FilterType<T>} filters - The filters to apply
 * @returns {boolean} True if the object matches any filter, false otherwise
 */
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

/**
 * Filter function to get distinct values from an array when used with Array.filter().
 * @template T
 * @param {T} value - The current value being processed
 * @param {number} index - The index of the current element
 * @param {T[]} self - The array being filtered
 * @returns {boolean} True if this is the first occurrence of the value
 */
export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};

/**
 * Compares two arrays and returns the added and removed elements.
 * @template T
 * @param {T[]} original - The original array
 * @param {T[]} next - The new array to compare against
 * @returns {{added: T[], removed: T[]}} Object containing added and removed elements
 */
export const getDifferences = <T>(original: T[], next: T[]) => {
  return {
    added: difference(next, original),
    removed: difference(original, next),
  };
};

/**
 * Groups an array of objects by a specified key.
 * @template T
 * @param {T[]} items - The array of objects to group
 * @param {keyof T} key - The key to group by
 * @returns {Record<string, T[]>} An object where keys are the grouped values and values are arrays of items
 */
export const groupBy = <T extends object>(items: T[], key: keyof T) => {
  return items.reduce((grouped: Record<string, T[]>, item) => {
    if (!item[key]) return grouped;
    const value = item[key];
    addToSimpleRelationship(grouped, value as string, item);
    return grouped;
  }, {});
};
