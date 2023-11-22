import { FilterType } from "types";

export function mutatingFilter<T>(
  array: Array<T>,
  condition: (arg: T) => boolean
): void {
  for (let l = array.length - 1; l >= 0; l -= 1) {
    if (!condition(array[l])) array.splice(l, 1);
  }
}

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
      return false;
    });
  });
};

export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};
