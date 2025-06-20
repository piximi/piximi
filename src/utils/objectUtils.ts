import { RecursivePartial } from "./types";

// Checks if an object has no properties
export const isObjectEmpty = <T extends object>(obj: T) => {
  return Object.keys(obj).length === 0;
};

// Used to update an arrayed property of a Record. Encapsulates the logic required to add to an existing array or to add a new one

export const updateRecordArray = <T extends string | number | symbol, K>(
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

export const getSubset = <T, K extends keyof T>(object: T, keys: K[]) => {
  const subset: Record<string, (typeof object)[K]> = {};

  keys.forEach((key) => {
    subset[key as string] = object[key];
  });
  return subset;
};

export const typedObjectEntries = <T extends object>(
  obj: T,
): { [K in keyof T]: [K, T[K]] }[keyof T][] => {
  return Object.entries(obj) as any;
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

export const isEnumValue = <E extends Record<string, string | number>>(
  enumObj: E,
  value: unknown,
): value is E[keyof E] => {
  return Object.values(enumObj)
    .filter((v) => typeof v === typeof value)
    .includes(value as E[keyof E]);
};
