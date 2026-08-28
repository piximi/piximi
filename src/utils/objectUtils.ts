import type { RecursivePartial } from "./types";

export const isObjectEmpty = <T extends object>(obj: T) => {
  return Object.keys(obj).length === 0;
};

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
export const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O,
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};
