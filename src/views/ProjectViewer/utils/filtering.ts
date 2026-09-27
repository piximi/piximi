import type { FilterType } from "utils/types";

export const isFiltered = <T extends object>(
  object: T,
  filters: FilterType<T>,
): boolean => {
  return (Object.keys(filters) as (keyof FilterType<T>)[]).some((key) => {
    const filterValues = filters[key];
    if (!filterValues) return false;
    const itemValue = object[key];
    if (Array.isArray(filterValues)) {
      return (filterValues as Array<typeof itemValue>).includes(itemValue);
    }
    if (
      key === "predictionConfidence" &&
      "max" in filterValues &&
      "min" in filterValues
    ) {
      if (filterValues.max - filterValues.min === 100) return false;
      if (typeof itemValue !== "number") return true;
      return itemValue <= filterValues.min || itemValue >= filterValues.max;
    }
    return false;
  });
};
