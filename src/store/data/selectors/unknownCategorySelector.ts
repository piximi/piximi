import { UNKNOWN_CLASS_CATEGORY_ID, DataStoreSlice } from "types";

export const unknownCategorySelector = ({ data }: { data: DataStoreSlice }) => {
  return data.categories.entities[UNKNOWN_CLASS_CATEGORY_ID];
};
