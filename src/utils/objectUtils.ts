import { RecursivePartial } from "./types";

/**
 * Checks if an object has no properties.
 * @template T
 * @param obj - The object to check
 * @returns True if the object has no properties, false otherwise
 */
export const isObjectEmpty = <T extends object>(obj: T) => {
  return Object.keys(obj).length === 0;
};

/**
 * Adds to an arrayed property of a Record. Encapsulates the logic required to add to an existing array or to add a new one.
 * @template T
 * @template K
 * @param record - The record containing arrays
 * @param key - The key to update in the record
 * @param value - The value(s) to add to the array
 * @returns void
 */
export const addToSimpleRelationship = <T extends string | number | symbol, K>(
  record: Record<T, K[]>,
  key: T,
  value: K | K[],
) => {
  if (!Array.isArray(value)) {
    value = [value];
  }
  if (key in record) {
    record[key].push(...value);
  } else {
    record[key] = [...value];
  }
};

/**
 * Removes property from an arrayed property of a Record. Encapsulates the logic required to remove from an existing array .
 * @template T
 * @template K
 * @param record - The record containing arrays
 * @param key - The key to update in the record
 * @param value - The value(s) to add to the array
 * @returns void
 */
export const removeFromSimpleRelationship = <
  T extends string | number | symbol,
  K,
>(
  record: Record<T, K[]>,
  key: T,
  value: K | K[],
) => {
  if (!Array.isArray(value)) {
    value = [value];
  }
  if (record[key]) {
    record[key] = record[key].filter((val) => !value.includes(val));
  }
};

/**
 * Creates a subset of an object containing only the specified keys.
 * @template T
 * @template K
 * @param object - The source object
 * @param keys - Array of keys to include in the subset
 * @returns A new object containing only the specified keys
 */
export const getSubset = <T, K extends keyof T>(object: T, keys: K[]) => {
  const subset: Record<string, (typeof object)[K]> = {};

  keys.forEach((key) => {
    subset[key as string] = object[key];
  });
  return subset;
};

/**
 * Returns typed entries of an object, similar to Object.entries but with proper typing.
 * @template T
 * @param obj - The object to get entries from
 * @returns Array of key-value pairs with proper typing
 */
export const typedObjectEntries = <T extends object>(
  obj: T,
): { [K in keyof T]: [K, T[K]] }[keyof T][] => {
  return Object.entries(obj) as any;
};

/**
 * Recursively assigns properties from updates object to existing object.
 * @template T
 * @param existingObject - The target object to update
 * @param updates - The partial object containing updates
 * @returns void
 */
export const recursiveAssign = <T extends object>(
  existingObject: T,
  updates: RecursivePartial<T>,
) => {
  Object.entries(updates).forEach(([key, _value]) => {
    if (typeof existingObject[key as keyof T] === "object") {
      recursiveAssign(
        existingObject[key as keyof T] as object,
        updates[key as keyof T]!,
      );
    } else if (!existingObject[key as keyof T]) {
      Object.assign(existingObject as object, {
        [key as keyof T]: updates[key as keyof T]!,
      });
    } else {
      Object.assign(
        existingObject[key as keyof T] as object,
        updates[key as keyof T]!,
      );
    }
  });
};
/**
 * Gets the keys of an enum object, filtering out numeric keys.
 * @template O
 * @template K
 * @param obj - The enum object
 * @returns Array of enum keys
 */
export const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O,
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

/**
 * Type guard to check if a value is a valid enum value.
 * @template E
 * @param enumObj - The enum object to check against
 * @param value - The value to check
 * @returns True if the value is a valid enum value, false otherwise
 */
export const isEnumValue = <E extends Record<string, string | number>>(
  enumObj: E,
  value: unknown,
): value is E[keyof E] => {
  return Object.values(enumObj)
    .filter((v) => typeof v === typeof value)
    .includes(value as E[keyof E]);
};

/**
 * Checks if an object excludes (does not contain) a specific key.
 * @template T
 * @param obj - The object to check
 * @param key - The key to check for exclusion
 * @returns True if the key is not in the object, false otherwise
 */
export const excludes = <T extends object>(obj: T, key: PropertyKey): boolean =>
  !(key in obj);
