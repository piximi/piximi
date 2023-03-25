import { UNKNOWN_CLASS_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { DataStoreSlice } from "types";

export const selectCreatedCategories = ({ data }: { data: DataStoreSlice }) => {
  const categories = Object.values(data.categories.entities).filter(
    (category) => category.id !== UNKNOWN_CLASS_CATEGORY_ID
  );

  return sortBy(categories, "name");
};
