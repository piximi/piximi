import type { RecursivePartial } from "./types";

export const isObjectEmpty = <T extends object>(obj: T) => {
  return Object.keys(obj).length === 0;
};

const isPlainObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/*
 * Merges `updates` into `existingObject` in place: nested objects are merged
 * level by level, and everything else (numbers, strings, booleans, arrays)
 * is replaced. Replacing matters: assigning onto a primitive is a no-op, so
 * an update to a plain field would otherwise be lost.
 */
export const recursiveAssign = <T extends object>(
  existingObject: T,
  updates: RecursivePartial<T>,
) => {
  Object.entries(updates).forEach(([key, value]) => {
    const existing = existingObject[key as keyof T];
    if (isPlainObject(existing) && isPlainObject(value)) {
      recursiveAssign(existing, value as RecursivePartial<object>);
    } else {
      Object.assign(existingObject as object, { [key]: value });
    }
  });
};
export const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O,
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};
